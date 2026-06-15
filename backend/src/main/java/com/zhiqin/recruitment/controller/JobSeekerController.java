package com.zhiqin.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.entity.JobSeeker;
import com.zhiqin.recruitment.service.JobSeekerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seeker")
public class JobSeekerController {

    @Autowired
    private JobSeekerService jobSeekerService;

    @GetMapping("/list")
    public Result<IPage<JobSeeker>> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer gender,
            @RequestParam(required = false) String education,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        IPage<JobSeeker> page = jobSeekerService.pageList(name, gender, education, status, startTime, endTime, pageNum, pageSize);
        return Result.success(page);
    }

    @GetMapping("/{id}")
    public Result<JobSeeker> getById(@PathVariable Long id) {
        JobSeeker jobSeeker = jobSeekerService.getById(id);
        return Result.success(jobSeeker);
    }

    @PostMapping
    public Result<Void> add(@RequestBody JobSeeker jobSeeker) {
        jobSeekerService.save(jobSeeker);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody JobSeeker jobSeeker) {
        jobSeeker.setId(id);
        jobSeekerService.updateById(jobSeeker);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        jobSeekerService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody Map<String, List<Long>> params) {
        List<Long> ids = params.get("ids");
        if (ids != null && !ids.isEmpty()) {
            jobSeekerService.batchDelete(ids);
        }
        return Result.success();
    }

}
