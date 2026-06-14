package com.zhiqin.recruitment.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.entity.Resume;
import com.zhiqin.recruitment.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    @GetMapping("/list")
    public Result<IPage<Resume>> list(
            @RequestParam(required = false) String seekerName,
            @RequestParam(required = false) Long positionId,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        IPage<Resume> page = resumeService.pageList(seekerName, positionId, status, pageNum, pageSize);
        return Result.success(page);
    }

    @GetMapping("/{id}")
    public Result<Resume> getById(@PathVariable Long id) {
        Resume resume = resumeService.getById(id);
        return Result.success(resume);
    }

    @PostMapping
    public Result<Void> add(@RequestBody Resume resume) {
        resumeService.save(resume);
        return Result.success();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Resume resume) {
        resume.setId(id);
        resumeService.updateById(resume);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        resumeService.removeById(id);
        return Result.success();
    }

}
