package com.zhiqin.recruitment.common;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PositionDetailVO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    private String title;

    private Long enterpriseId;

    private String enterpriseName;

    private String category;

    private Integer salaryMin;

    private Integer salaryMax;

    private String city;

    private String education;

    private String experience;

    private String responsibility;

    private String requirement;

    private Integer viewCount;

    private Integer applyCount;

    private Integer status;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime expireTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime updateTime;

    private List<ResumeRecordVO> resumeList;

    @Data
    public static class ResumeRecordVO implements Serializable {
        private static final long serialVersionUID = 1L;
        private Long id;
        private Long seekerId;
        private String seekerName;
        private String positionTitle;
        private String enterpriseName;
        private Integer status;
        private String statusText;
        private String remark;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        private LocalDateTime applyTime;
    }
}
