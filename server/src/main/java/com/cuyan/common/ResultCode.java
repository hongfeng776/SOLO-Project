package com.cuyan.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未登录或令牌已过期"),
    FORBIDDEN(403, "权限不足"),
    NOT_FOUND(404, "资源不存在"),
    INTERNAL_SERVER_ERROR(500, "服务器内部错误"),

    USERNAME_OR_PASSWORD_ERROR(1001, "用户名或密码错误"),
    USER_NOT_EXIST(1002, "用户不存在"),
    USER_ALREADY_EXIST(1003, "用户已存在"),
    TOKEN_INVALID(1004, "无效的令牌"),
    TOKEN_EXPIRED(1005, "令牌已过期"),
    ;

    private final Integer code;
    private final String message;
}
