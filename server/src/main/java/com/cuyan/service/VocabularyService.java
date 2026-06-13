package com.cuyan.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.VocabularyCreateDTO;
import com.cuyan.dto.VocabularyQueryDTO;
import com.cuyan.dto.VocabularyUpdateDTO;
import com.cuyan.entity.Vocabulary;
import com.cuyan.vo.VocabularyVO;

import java.util.List;

public interface VocabularyService extends IService<Vocabulary> {

    Page<VocabularyVO> pageQuery(VocabularyQueryDTO queryDTO);

    VocabularyVO getDetail(Long id);

    void create(VocabularyCreateDTO createDTO);

    void update(VocabularyUpdateDTO updateDTO);

    void removeByIds(List<Long> ids);

    void updateStatus(Long id, Integer status);

    void batchUpdateStatus(BatchStatusDTO batchStatusDTO);
}
