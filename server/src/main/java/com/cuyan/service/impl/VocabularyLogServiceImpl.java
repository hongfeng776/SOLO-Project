package com.cuyan.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.cuyan.common.UserContext;
import com.cuyan.entity.User;
import com.cuyan.entity.VocabularyLog;
import com.cuyan.mapper.UserMapper;
import com.cuyan.mapper.VocabularyLogMapper;
import com.cuyan.service.VocabularyLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VocabularyLogServiceImpl extends ServiceImpl<VocabularyLogMapper, VocabularyLog> implements VocabularyLogService {

    private final UserMapper userMapper;

    @Override
    public void logStatusChange(Long vocabularyId, String vocabularyWord, Integer oldStatus, Integer newStatus, String remark) {
        Long operatorId = UserContext.getUserId();
        String operatorName = null;
        if (operatorId != null) {
            User user = userMapper.selectById(operatorId);
            if (user != null) {
                operatorName = user.getUsername();
            }
        }
        VocabularyLog log = new VocabularyLog();
        log.setVocabularyId(vocabularyId);
        log.setVocabularyWord(vocabularyWord);
        log.setOperationType("status");
        log.setOldStatus(oldStatus);
        log.setNewStatus(newStatus);
        log.setOperatorId(operatorId);
        log.setOperatorName(operatorName);
        log.setRemark(remark);
        save(log);
    }
}
