package com.cuyan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ViolationCreateDTO {

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @NotBlank(message = "举报类型不能为空")
    private String targetType;

    @NotNull(message = "目标ID不能为空")
    private Long targetId;

    @NotBlank(message = "举报原因不能为空")
    private String reason;

    private String description;
}
