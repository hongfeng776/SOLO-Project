package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.entity.Violation;

public interface ViolationService extends IService<Violation> {

    IPage<Violation> pageList(String targetName, Integer targetType, Integer type, Integer handleStatus, Integer pageNum, Integer pageSize);

}
