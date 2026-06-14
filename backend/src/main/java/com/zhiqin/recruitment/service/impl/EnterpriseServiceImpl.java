package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.entity.Enterprise;
import com.zhiqin.recruitment.mapper.EnterpriseMapper;
import com.zhiqin.recruitment.service.EnterpriseService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class EnterpriseServiceImpl extends ServiceImpl<EnterpriseMapper, Enterprise> implements EnterpriseService {

    @Override
    public IPage<Enterprise> pageList(String name, String industry, String entryTimeStart, String entryTimeEnd, Integer pageNum, Integer pageSize) {
        Page<Enterprise> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Enterprise> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(name != null && !name.isEmpty(), Enterprise::getName, name);
        queryWrapper.like(industry != null && !industry.isEmpty(), Enterprise::getIndustry, industry);
        if (entryTimeStart != null && !entryTimeStart.isEmpty()) {
            LocalDateTime start = LocalDateTime.of(LocalDate.parse(entryTimeStart), LocalTime.MIN);
            queryWrapper.ge(Enterprise::getEntryTime, start);
        }
        if (entryTimeEnd != null && !entryTimeEnd.isEmpty()) {
            LocalDateTime end = LocalDateTime.of(LocalDate.parse(entryTimeEnd), LocalTime.MAX);
            queryWrapper.le(Enterprise::getEntryTime, end);
        }
        queryWrapper.orderByDesc(Enterprise::getCreateTime);
        return this.page(page, queryWrapper);
    }

}
