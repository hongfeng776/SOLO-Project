package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.entity.Enterprise;

public interface EnterpriseService extends IService<Enterprise> {

    IPage<Enterprise> pageList(String name, String industry, String entryTimeStart, String entryTimeEnd, Integer pageNum, Integer pageSize);

}
