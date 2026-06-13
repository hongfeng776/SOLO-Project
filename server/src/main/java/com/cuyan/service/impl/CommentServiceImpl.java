package com.cuyan.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cuyan.common.BusinessException;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.CommentQueryDTO;
import com.cuyan.entity.Comment;
import com.cuyan.entity.Material;
import com.cuyan.entity.User;
import com.cuyan.entity.Vocabulary;
import com.cuyan.mapper.CommentMapper;
import com.cuyan.mapper.MaterialMapper;
import com.cuyan.mapper.UserMapper;
import com.cuyan.mapper.VocabularyMapper;
import com.cuyan.service.CommentService;
import com.cuyan.vo.CommentVO;
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
public class CommentServiceImpl extends ServiceImpl<CommentMapper, Comment> implements CommentService {

    private final UserMapper userMapper;
    private final VocabularyMapper vocabularyMapper;
    private final MaterialMapper materialMapper;

    @Override
    public Page<CommentVO> pageQuery(CommentQueryDTO queryDTO) {
        Page<Comment> page = new Page<>(queryDTO.getPageNum(), queryDTO.getPageSize());
        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(queryDTO.getVocabularyId() != null, Comment::getVocabularyId, queryDTO.getVocabularyId())
                .eq(queryDTO.getMaterialId() != null, Comment::getMaterialId, queryDTO.getMaterialId())
                .eq(queryDTO.getUserId() != null, Comment::getUserId, queryDTO.getUserId())
                .eq(queryDTO.getStatus() != null, Comment::getStatus, queryDTO.getStatus())
                .like(StringUtils.hasText(queryDTO.getKeyword()), Comment::getContent, queryDTO.getKeyword())
                .orderByDesc(Comment::getCreateTime);
        Page<Comment> commentPage = page(page, wrapper);
        return convertToVOPage(commentPage);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long id, Integer status) {
        Comment comment = getById(id);
        if (comment == null) {
            throw new BusinessException("评论不存在");
        }
        comment.setStatus(status);
        updateById(comment);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchUpdateStatus(BatchStatusDTO batchStatusDTO) {
        LambdaUpdateWrapper<Comment> wrapper = new LambdaUpdateWrapper<>();
        wrapper.in(Comment::getId, batchStatusDTO.getIds())
                .set(Comment::getStatus, batchStatusDTO.getStatus());
        update(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void removeByIds(List<Long> ids) {
        super.removeByIds(ids);
    }

    private Page<CommentVO> convertToVOPage(Page<Comment> page) {
        Page<CommentVO> voPage = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        List<Comment> records = page.getRecords();
        if (records.isEmpty()) {
            voPage.setRecords(List.of());
            return voPage;
        }
        Set<Long> userIds = records.stream()
                .map(Comment::getUserId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Long> vocabIds = records.stream()
                .map(Comment::getVocabularyId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Long> materialIds = records.stream()
                .map(Comment::getMaterialId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<Long, String> userMap = Map.of();
        if (!userIds.isEmpty()) {
            userMap = userMapper.selectBatchIds(userIds).stream()
                    .collect(Collectors.toMap(User::getId, User::getUsername));
        }
        Map<Long, String> vocabMap = Map.of();
        if (!vocabIds.isEmpty()) {
            vocabMap = vocabularyMapper.selectBatchIds(vocabIds).stream()
                    .collect(Collectors.toMap(Vocabulary::getId, Vocabulary::getWord));
        }
        Map<Long, String> materialMap = Map.of();
        if (!materialIds.isEmpty()) {
            materialMap = materialMapper.selectBatchIds(materialIds).stream()
                    .collect(Collectors.toMap(Material::getId, Material::getTitle));
        }
        final Map<Long, String> finalUserMap = userMap;
        final Map<Long, String> finalVocabMap = vocabMap;
        final Map<Long, String> finalMaterialMap = materialMap;
        List<CommentVO> voList = records.stream().map(c -> {
            CommentVO vo = new CommentVO();
            BeanUtils.copyProperties(c, vo);
            vo.setUserName(finalUserMap.getOrDefault(c.getUserId(), ""));
            vo.setVocabularyWord(finalVocabMap.getOrDefault(c.getVocabularyId(), ""));
            vo.setMaterialTitle(finalMaterialMap.getOrDefault(c.getMaterialId(), ""));
            return vo;
        }).collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }
}
