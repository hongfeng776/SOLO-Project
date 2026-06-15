package com.cuyan.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cuyan.common.BusinessException;
import com.cuyan.common.UserContext;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.VocabularyCreateDTO;
import com.cuyan.dto.VocabularyQueryDTO;
import com.cuyan.dto.VocabularyUpdateDTO;
import com.cuyan.entity.Comment;
import com.cuyan.entity.Material;
import com.cuyan.entity.User;
import com.cuyan.entity.Vocabulary;
import com.cuyan.mapper.CommentMapper;
import com.cuyan.mapper.MaterialMapper;
import com.cuyan.mapper.UserMapper;
import com.cuyan.mapper.VocabularyMapper;
import com.cuyan.service.VocabularyService;
import com.cuyan.vo.VocabularyVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VocabularyServiceImpl extends ServiceImpl<VocabularyMapper, Vocabulary> implements VocabularyService {

    private final UserMapper userMapper;
    private final MaterialMapper materialMapper;
    private final CommentMapper commentMapper;

    @Override
    public Page<VocabularyVO> pageQuery(VocabularyQueryDTO queryDTO) {
        Page<Vocabulary> page = new Page<>(queryDTO.getPageNum(), queryDTO.getPageSize());
        LambdaQueryWrapper<Vocabulary> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(queryDTO.getWord()), Vocabulary::getWord, queryDTO.getWord())
                .eq(StringUtils.hasText(queryDTO.getPartOfSpeech()), Vocabulary::getPartOfSpeech, queryDTO.getPartOfSpeech())
                .eq(queryDTO.getStatus() != null, Vocabulary::getStatus, queryDTO.getStatus())
                .eq(queryDTO.getCreatorId() != null, Vocabulary::getCreatorId, queryDTO.getCreatorId())
                .eq(queryDTO.getDifficulty() != null, Vocabulary::getDifficulty, queryDTO.getDifficulty())
                .like(StringUtils.hasText(queryDTO.getBookName()), Vocabulary::getBookName, queryDTO.getBookName())
                .like(StringUtils.hasText(queryDTO.getKeyword()), Vocabulary::getWord, queryDTO.getKeyword())
                .ge(StringUtils.hasText(queryDTO.getStartTime()), Vocabulary::getCreateTime, queryDTO.getStartTime())
                .lt(StringUtils.hasText(queryDTO.getEndTime()), Vocabulary::getCreateTime, getEndDateTime(queryDTO.getEndTime()))
                .orderByDesc(Vocabulary::getCreateTime);
        Page<Vocabulary> vocabularyPage = page(page, wrapper);
        return convertToVOPage(vocabularyPage);
    }

    private LocalDateTime getEndDateTime(String endTime) {
        if (!StringUtils.hasText(endTime)) {
            return null;
        }
        try {
            if (endTime.length() == 10) {
                LocalDate date = LocalDate.parse(endTime, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                return date.plusDays(1).atStartOfDay();
            } else {
                return LocalDateTime.parse(endTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            }
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public VocabularyVO getDetail(Long id) {
        Vocabulary vocabulary = getById(id);
        if (vocabulary == null) {
            throw new BusinessException("词汇不存在");
        }
        return convertToVO(vocabulary);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void create(VocabularyCreateDTO createDTO) {
        Vocabulary vocabulary = new Vocabulary();
        BeanUtils.copyProperties(createDTO, vocabulary);
        vocabulary.setCreatorId(UserContext.getUserId());
        if (vocabulary.getStatus() == null) {
            vocabulary.setStatus(1);
        }
        save(vocabulary);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(VocabularyUpdateDTO updateDTO) {
        Vocabulary vocabulary = getById(updateDTO.getId());
        if (vocabulary == null) {
            throw new BusinessException("词汇不存在");
        }
        if (StringUtils.hasText(updateDTO.getWord())) {
            vocabulary.setWord(updateDTO.getWord());
        }
        if (updateDTO.getPhonetic() != null) {
            vocabulary.setPhonetic(updateDTO.getPhonetic());
        }
        if (updateDTO.getPartOfSpeech() != null) {
            vocabulary.setPartOfSpeech(updateDTO.getPartOfSpeech());
        }
        if (updateDTO.getDefinition() != null) {
            vocabulary.setDefinition(updateDTO.getDefinition());
        }
        if (updateDTO.getExample() != null) {
            vocabulary.setExample(updateDTO.getExample());
        }
        if (updateDTO.getTranslation() != null) {
            vocabulary.setTranslation(updateDTO.getTranslation());
        }
        if (updateDTO.getDifficulty() != null) {
            vocabulary.setDifficulty(updateDTO.getDifficulty());
        }
        if (updateDTO.getBookName() != null) {
            vocabulary.setBookName(updateDTO.getBookName());
        }
        if (updateDTO.getStatus() != null) {
            vocabulary.setStatus(updateDTO.getStatus());
        }
        updateById(vocabulary);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeByIds(List<Long> ids) {
        for (Long id : ids) {
            Long materialCount = materialMapper.selectCount(new LambdaQueryWrapper<Material>()
                    .eq(Material::getVocabularyId, id));
            Long commentCount = commentMapper.selectCount(new LambdaQueryWrapper<Comment>()
                    .eq(Comment::getVocabularyId, id));
            if (materialCount > 0 || commentCount > 0) {
                throw new BusinessException("存在关联数据，无法删除");
            }
        }
        super.removeByIds(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        Vocabulary vocabulary = getById(id);
        if (vocabulary == null) {
            throw new BusinessException("词汇不存在");
        }
        vocabulary.setStatus(status);
        updateById(vocabulary);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateStatus(BatchStatusDTO batchStatusDTO) {
        LambdaUpdateWrapper<Vocabulary> wrapper = new LambdaUpdateWrapper<>();
        wrapper.in(Vocabulary::getId, batchStatusDTO.getIds())
                .set(Vocabulary::getStatus, batchStatusDTO.getStatus());
        update(wrapper);
    }

    private Page<VocabularyVO> convertToVOPage(Page<Vocabulary> page) {
        Page<VocabularyVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        List<Vocabulary> records = page.getRecords();
        if (records.isEmpty()) {
            voPage.setRecords(List.of());
            return voPage;
        }
        Set<Long> creatorIds = records.stream()
                .map(Vocabulary::getCreatorId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Long> vocabIds = records.stream()
                .map(Vocabulary::getId)
                .collect(Collectors.toSet());
        Map<Long, String> userMap = Map.of();
        if (!creatorIds.isEmpty()) {
            userMap = userMapper.selectBatchIds(creatorIds).stream()
                    .collect(Collectors.toMap(User::getId, User::getUsername));
        }
        Map<Long, Integer> materialCountMap = Map.of();
        if (!vocabIds.isEmpty()) {
            List<Material> materials = materialMapper.selectList(new LambdaQueryWrapper<Material>()
                    .in(Material::getVocabularyId, vocabIds));
            materialCountMap = materials.stream()
                    .collect(Collectors.groupingBy(Material::getVocabularyId, Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));
        }
        Map<Long, Integer> commentCountMap = Map.of();
        if (!vocabIds.isEmpty()) {
            List<Comment> comments = commentMapper.selectList(new LambdaQueryWrapper<Comment>()
                    .in(Comment::getVocabularyId, vocabIds));
            commentCountMap = comments.stream()
                    .collect(Collectors.groupingBy(Comment::getVocabularyId, Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));
        }
        final Map<Long, String> finalUserMap = userMap;
        final Map<Long, Integer> finalMaterialCountMap = materialCountMap;
        final Map<Long, Integer> finalCommentCountMap = commentCountMap;
        List<VocabularyVO> voList = records.stream().map(v -> {
            VocabularyVO vo = new VocabularyVO();
            BeanUtils.copyProperties(v, vo);
            vo.setCreatorName(finalUserMap.getOrDefault(v.getCreatorId(), ""));
            vo.setMaterialCount(finalMaterialCountMap.getOrDefault(v.getId(), 0));
            vo.setCommentCount(finalCommentCountMap.getOrDefault(v.getId(), 0));
            return vo;
        }).collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    private VocabularyVO convertToVO(Vocabulary vocabulary) {
        VocabularyVO vo = new VocabularyVO();
        BeanUtils.copyProperties(vocabulary, vo);
        if (vocabulary.getCreatorId() != null) {
            User user = userMapper.selectById(vocabulary.getCreatorId());
            if (user != null) {
                vo.setCreatorName(user.getUsername());
            }
        }
        Long materialCount = materialMapper.selectCount(new LambdaQueryWrapper<Material>()
                .eq(Material::getVocabularyId, vocabulary.getId()));
        Long commentCount = commentMapper.selectCount(new LambdaQueryWrapper<Comment>()
                .eq(Comment::getVocabularyId, vocabulary.getId()));
        vo.setMaterialCount(materialCount.intValue());
        vo.setCommentCount(commentCount.intValue());
        return vo;
    }
}
