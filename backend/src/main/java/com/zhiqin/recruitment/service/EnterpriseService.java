package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.common.EnterpriseDetailVO;
import com.zhiqin.recruitment.entity.Enterprise;

import java.util.List;

public interface EnterpriseService extends IService<Enterprise> {

    IPage<Enterprise> pageList(String name, String industry, Integer status, String entryTimeStart, String entryTimeEnd, Integer pageNum, Integer pageSize);

    EnterpriseDetailVO getDetail(Long id);

    void batchUpdateStatus(List<Long> ids, Integer status);

}
