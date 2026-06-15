package com.zhiqin.recruitment.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhiqin.recruitment.entity.JobSeeker;

import java.util.List;

public interface JobSeekerService extends IService<JobSeeker> {

    IPage<JobSeeker> pageList(String name, Integer gender, String education, Integer status, String startTime, String endTime, Integer pageNum, Integer pageSize);

    void batchDelete(List<Long> ids);

    void batchUpdateStatus(List<Long> ids, Integer status);

    List<JobSeeker> listByConditions(String name, Integer gender, String education, Integer status, String startTime, String endTime);

}
