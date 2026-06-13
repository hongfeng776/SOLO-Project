package com.cuyan.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.cuyan.dto.ViolationCreateDTO;
import com.cuyan.dto.ViolationHandleDTO;
import com.cuyan.dto.ViolationQueryDTO;
import com.cuyan.entity.Violation;
import com.cuyan.vo.ViolationVO;

import java.util.List;

public interface ViolationService extends IService<Violation> {

    Page<ViolationVO> pageQuery(ViolationQueryDTO queryDTO);

    void create(ViolationCreateDTO createDTO);

    void handle(ViolationHandleDTO handleDTO);

    void removeByIds(List<Long> ids);
}
