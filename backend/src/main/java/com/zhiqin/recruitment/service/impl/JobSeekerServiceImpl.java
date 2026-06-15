package com.zhiqin.recruitment.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhiqin.recruitment.entity.JobSeeker;
import com.zhiqin.recruitment.mapper.JobSeekerMapper;
import com.zhiqin.recruitment.service.JobSeekerService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class JobSeekerServiceImpl extends ServiceImpl<JobSeekerMapper, JobSeeker> implements JobSeekerService {

    @Override
    public IPage<JobSeeker> pageList(String name, Integer gender, String education, Integer status, String startTime, String endTime, Integer pageNum, Integer pageSize) {
        Page<JobSeeker> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<JobSeeker> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.like(StringUtils.hasText(name), JobSeeker::getName, name);
        queryWrapper.eq(gender != null, JobSeeker::getGender, gender);
        queryWrapper.eq(StringUtils.hasText(education), JobSeeker::getEducation, education);
        queryWrapper.eq(status != null, JobSeeker::getStatus, status);
        if (StringUtils.hasText(startTime)) {
            LocalDateTime start = LocalDate.parse(startTime).atStartOfDay();
            queryWrapper.ge(JobSeeker::getCreateTime, start);
        }
        if (StringUtils.hasText(endTime)) {
            LocalDateTime end = LocalDate.parse(endTime).atTime(LocalTime.MAX);
            queryWrapper.le(JobSeeker::getCreateTime, end);
        }
        queryWrapper.orderByDesc(JobSeeker::getCreateTime);
        return this.page(page, queryWrapper);
    }

    @Override
    public void batchDelete(List<Long> ids) {
        this.removeByIds(ids);
    }

}
