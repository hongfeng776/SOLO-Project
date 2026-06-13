package com.cuyan.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_violation")
public class Violation {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String targetType;

    private Long targetId;

    private String reason;

    private String description;

    private Integer status;

    private Long handlerId;

    private String handleResult;

    @TableField(exist = false)
    private String userName;

    @TableField(exist = false)
    private String handlerName;

    @TableLogic
    private Integer deleted;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
