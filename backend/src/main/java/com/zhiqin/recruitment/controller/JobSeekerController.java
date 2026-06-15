package com.zhiqin.recruitment.controller;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.support.ExcelTypeEnum;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhiqin.recruitment.common.BatchIdsDTO;
import com.zhiqin.recruitment.common.BatchStatusDTO;
import com.zhiqin.recruitment.common.Result;
import com.zhiqin.recruitment.common.SeekerExcelVO;
import com.zhiqin.recruitment.entity.JobSeeker;
import com.zhiqin.recruitment.service.JobSeekerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/seeker")
public class JobSeekerController {

    @Autowired
    private JobSeekerService jobSeekerService;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

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

    @PutMapping("/batch-status")
    public Result<Void> batchUpdateStatus(@RequestBody BatchStatusDTO dto) {
        if (dto.getIds() != null && !dto.getIds().isEmpty() && dto.getStatus() != null) {
            jobSeekerService.batchUpdateStatus(dto.getIds(), dto.getStatus());
        }
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        jobSeekerService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody BatchIdsDTO dto) {
        if (dto.getIds() != null && !dto.getIds().isEmpty()) {
            jobSeekerService.batchDelete(dto.getIds());
        }
        return Result.success();
    }

    @GetMapping("/export")
    public void export(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer gender,
            @RequestParam(required = false) String education,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            HttpServletResponse response) throws IOException {
        List<JobSeeker> list = jobSeekerService.listByConditions(name, gender, education, status, startTime, endTime);
        List<SeekerExcelVO> dataList = new ArrayList<>();
        for (int i = 0; i < list.size(); i++) {
            JobSeeker seeker = list.get(i);
            SeekerExcelVO vo = new SeekerExcelVO();
            vo.setIndex(i + 1);
            vo.setName(seeker.getName());
            vo.setGender(seeker.getGender() != null && seeker.getGender() == 1 ? "男" : "女");
            vo.setAge(seeker.getAge());
            vo.setPhone(seeker.getPhone());
            vo.setEmail(seeker.getEmail());
            vo.setEducation(seeker.getEducation());
            vo.setWorkYears(seeker.getWorkYears() != null ? seeker.getWorkYears() + "年" : "");
            vo.setJobIntention(seeker.getJobIntention());
            vo.setExpectedSalary(seeker.getExpectedSalary());
            vo.setExpectedCity(seeker.getExpectedCity());
            vo.setStatus(seeker.getStatus() != null && seeker.getStatus() == 1 ? "正常" : "禁用");
            vo.setCreateTime(seeker.getCreateTime() != null ? seeker.getCreateTime().format(DATE_TIME_FORMATTER) : "");
            dataList.add(vo);
        }

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("求职者数据_" + System.currentTimeMillis(), StandardCharsets.UTF_8).replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName + ExcelTypeEnum.XLSX.getValue());

        EasyExcel.write(response.getOutputStream(), SeekerExcelVO.class)
                .excelType(ExcelTypeEnum.XLSX)
                .sheet("求职者列表")
                .doWrite(dataList);
    }

}
