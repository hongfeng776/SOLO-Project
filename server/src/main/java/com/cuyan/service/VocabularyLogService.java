package com.cuyan.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.cuyan.entity.VocabularyLog;

public interface VocabularyLogService extends IService<VocabularyLog> {

    void logStatusChange(Long vocabularyId, String vocabularyWord, Integer oldStatus, Integer newStatus, String remark);
}
