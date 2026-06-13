package com.zhiqin.recruitment.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    FAIL(500, "操作失败"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权，请先登录"),
    FORBIDDEN(403, "没有权限访问"),
    NOT_FOUND(404, "请求资源不存在"),
    TOKEN_EXPIRED(40101, "Token已过期，请重新登录"),
    TOKEN_INVALID(40102, "Token无效，请重新登录"),
    USERNAME_PASSWORD_ERROR(50001, "用户名或密码错误"),
    USER_DISABLED(50002, "账号已被禁用"),
    USER_NOT_FOUND(50003, "用户不存在"),
    USER_ALREADY_EXISTS(50004, "用户已存在");

    private final Integer code;

    private final String message;

}
