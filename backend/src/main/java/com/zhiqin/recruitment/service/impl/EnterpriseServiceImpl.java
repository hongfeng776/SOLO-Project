package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.entity.Enterprise;
import com.zhiqin.recruitment.mapper.EnterpriseMapper;
import com.zhiqin.recruitment.service.EnterpriseService;
import org.springframework.stereotype.Service;

@Service
public class EnterpriseServiceImpl extends ServiceImpl<EnterpriseMapper, Enterprise> implements EnterpriseService {

    @Override
    public IPage<Enterprise> pageList(String name, Integer status, Integer pageNum, Integer pageSize) {
        Page<Enterprise> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Enterprise> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(name != null && !name.isEmpty(), Enterprise::getName, name);
        queryWrapper.eq(status != null, Enterprise::getStatus, status);
        queryWrapper.orderByDesc(Enterprise::getCreateTime);
        return this.page(page, queryWrapper);
    }

}
