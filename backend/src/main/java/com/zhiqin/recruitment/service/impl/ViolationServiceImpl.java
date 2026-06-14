package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.entity.Violation;
import com.zhiqin.recruitment.mapper.ViolationMapper;
import com.zhiqin.recruitment.service.ViolationService;
import org.springframework.stereotype.Service;

@Service
public class ViolationServiceImpl extends ServiceImpl<ViolationMapper, Violation> implements ViolationService {

    @Override
    public IPage<Violation> pageList(String targetName, Integer targetType, Integer type, Integer handleStatus, Integer pageNum, Integer pageSize) {
        Page<Violation> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Violation> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(targetName != null && !targetName.isEmpty(), Violation::getTargetName, targetName);
        queryWrapper.eq(targetType != null, Violation::getTargetType, targetType);
        queryWrapper.eq(type != null, Violation::getType, type);
        queryWrapper.eq(handleStatus != null, Violation::getHandleStatus, handleStatus);
        queryWrapper.orderByDesc(Violation::getCreateTime);
        return this.page(page, queryWrapper);
    }

}
