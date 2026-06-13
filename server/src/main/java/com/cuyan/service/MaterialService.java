package com.cuyan.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.cuyan.dto.BatchStatusDTO;
import com.cuyan.dto.MaterialCreateDTO;
import com.cuyan.dto.MaterialQueryDTO;
import com.cuyan.dto.MaterialUpdateDTO;
import com.cuyan.entity.Material;
import com.cuyan.vo.MaterialVO;

import java.util.List;

public interface MaterialService extends IService<Material> {

    Page<MaterialVO> pageQuery(MaterialQueryDTO queryDTO);

    MaterialVO getDetail(Long id);

    void create(MaterialCreateDTO createDTO);

    void update(MaterialUpdateDTO updateDTO);

    void removeByIds(List<Long> ids);

    void updateStatus(Long id, Integer status);

    void batchUpdateStatus(BatchStatusDTO batchStatusDTO);
}
