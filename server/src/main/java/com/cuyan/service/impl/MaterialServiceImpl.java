package com.cuyan.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cuyan.common.BusinessException;
import com.cuyan.common.UserContext;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.MaterialCreateDTO;
import com.cuyan.dto.MaterialQueryDTO;
import com.cuyan.dto.MaterialUpdateDTO;
import com.cuyan.entity.Comment;
import com.cuyan.entity.Material;
import com.cuyan.entity.User;
import com.cuyan.entity.Vocabulary;
import com.cuyan.mapper.CommentMapper;
import com.cuyan.mapper.MaterialMapper;
import com.cuyan.mapper.UserMapper;
import com.cuyan.mapper.VocabularyMapper;
import com.cuyan.service.MaterialService;
import com.cuyan.vo.MaterialVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaterialServiceImpl extends ServiceImpl<MaterialMapper, Material> implements MaterialService {

    private final UserMapper userMapper;
    private final VocabularyMapper vocabularyMapper;
    private final CommentMapper commentMapper;

    @Override
    public Page<MaterialVO> pageQuery(MaterialQueryDTO queryDTO) {
        Page<Material> page = new Page<>(queryDTO.getPageNum(), queryDTO.getPageSize());
        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(queryDTO.getTitle()), Material::getTitle, queryDTO.getTitle())
                .eq(queryDTO.getVocabularyId() != null, Material::getVocabularyId, queryDTO.getVocabularyId())
                .eq(StringUtils.hasText(queryDTO.getMaterialType()), Material::getMaterialType, queryDTO.getMaterialType())
                .eq(queryDTO.getDifficulty() != null, Material::getDifficulty, queryDTO.getDifficulty())
                .eq(queryDTO.getStatus() != null, Material::getStatus, queryDTO.getStatus())
                .eq(queryDTO.getCreatorId() != null, Material::getCreatorId, queryDTO.getCreatorId())
                .like(StringUtils.hasText(queryDTO.getKeyword()), Material::getTitle, queryDTO.getKeyword())
                .orderByDesc(Material::getCreateTime);
        Page<Material> materialPage = page(page, wrapper);
        return convertToVOPage(materialPage);
    }

    @Override
    public MaterialVO getDetail(Long id) {
        Material material = getById(id);
        if (material == null) {
            throw new BusinessException("素材不存在");
        }
        return convertToVO(material);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(MaterialCreateDTO createDTO) {
        Material material = new Material();
        BeanUtils.copyProperties(createDTO, material);
        material.setCreatorId(UserContext.getUserId());
        if (material.getStatus() == null) {
            material.setStatus(1);
        }
        save(material);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(MaterialUpdateDTO updateDTO) {
        Material material = getById(updateDTO.getId());
        if (material == null) {
            throw new BusinessException("素材不存在");
        }
        BeanUtils.copyProperties(updateDTO, material);
        updateById(material);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeByIds(List<Long> ids) {
        for (Long id : ids) {
            Long commentCount = commentMapper.selectCount(new LambdaQueryWrapper<Comment>()
                    .eq(Comment::getMaterialId, id));
            if (commentCount > 0) {
                throw new BusinessException("存在关联评论，无法删除");
            }
        }
        super.removeByIds(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        Material material = getById(id);
        if (material == null) {
            throw new BusinessException("素材不存在");
        }
        material.setStatus(status);
        updateById(material);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateStatus(BatchStatusDTO batchStatusDTO) {
        LambdaUpdateWrapper<Material> wrapper = new LambdaUpdateWrapper<>();
        wrapper.in(Material::getId, batchStatusDTO.getIds())
                .set(Material::getStatus, batchStatusDTO.getStatus());
        update(wrapper);
    }

    private Page<MaterialVO> convertToVOPage(Page<Material> page) {
        Page<MaterialVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        List<Material> records = page.getRecords();
        if (records.isEmpty()) {
            voPage.setRecords(List.of());
            return voPage;
        }
        Set<Long> creatorIds = records.stream()
                .map(Material::getCreatorId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Long> vocabIds = records.stream()
                .map(Material::getVocabularyId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Long> materialIds = records.stream()
                .map(Material::getId)
                .collect(Collectors.toSet());
        Map<Long, String> userMap = Map.of();
        if (!creatorIds.isEmpty()) {
            userMap = userMapper.selectBatchIds(creatorIds).stream()
                    .collect(Collectors.toMap(User::getId, User::getUsername));
        }
        Map<Long, String> vocabMap = Map.of();
        if (!vocabIds.isEmpty()) {
            vocabMap = vocabularyMapper.selectBatchIds(vocabIds).stream()
                    .collect(Collectors.toMap(Vocabulary::getId, Vocabulary::getWord));
        }
        Map<Long, Integer> commentCountMap = Map.of();
        if (!materialIds.isEmpty()) {
            List<Comment> comments = commentMapper.selectList(new LambdaQueryWrapper<Comment>()
                    .in(Comment::getMaterialId, materialIds));
            commentCountMap = comments.stream()
                    .collect(Collectors.groupingBy(Comment::getMaterialId, Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));
        }
        final Map<Long, String> finalUserMap = userMap;
        final Map<Long, String> finalVocabMap = vocabMap;
        final Map<Long, Integer> finalCommentCountMap = commentCountMap;
        List<MaterialVO> voList = records.stream().map(m -> {
            MaterialVO vo = new MaterialVO();
            BeanUtils.copyProperties(m, vo);
            vo.setCreatorName(finalUserMap.getOrDefault(m.getCreatorId(), ""));
            vo.setVocabularyWord(finalVocabMap.getOrDefault(m.getVocabularyId(), ""));
            vo.setCommentCount(finalCommentCountMap.getOrDefault(m.getId(), 0));
            return vo;
        }).collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    private MaterialVO convertToVO(Material material) {
        MaterialVO vo = new MaterialVO();
        BeanUtils.copyProperties(material, vo);
        if (material.getCreatorId() != null) {
            User user = userMapper.selectById(material.getCreatorId());
            if (user != null) {
                vo.setCreatorName(user.getUsername());
            }
        }
        if (material.getVocabularyId() != null) {
            Vocabulary vocabulary = vocabularyMapper.selectById(material.getVocabularyId());
            if (vocabulary != null) {
                vo.setVocabularyWord(vocabulary.getWord());
            }
        }
        Long commentCount = commentMapper.selectCount(new LambdaQueryWrapper<Comment>()
                .eq(Comment::getMaterialId, material.getId()));
        vo.setCommentCount(commentCount.intValue());
        return vo;
    }
}
