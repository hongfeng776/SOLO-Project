package com.cuyan.interceptor;

import cn.hutool.crypto.SecureUtil;
import com.cuyan.common.BusinessException;
import com.cuyan.common.UserContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class RepeatSubmitInterceptor implements HandlerInterceptor {

    private static final int REPEAT_INTERVAL = 300;
    private static final String REPEAT_KEY_PREFIX = "repeat_submit:";

    private final StringRedisTemplate redisTemplate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String method = request.getMethod();

        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        Long userId = UserContext.getUserId();
        String userIdStr = userId != null ? String.valueOf(userId) : "anon";

        String uri = request.getRequestURI();
        String queryString = request.getQueryString() != null ? request.getQueryString() : "";

        String body = "";
        if (request instanceof ContentCachingRequestWrapper wrapper) {
            body = new String(wrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
        }

        String rawKey = userIdStr + ":" + method + ":" + uri + "?" + queryString + ":" + body;
        String md5Key = SecureUtil.md5(rawKey);
        String redisKey = REPEAT_KEY_PREFIX + md5Key;

        Boolean absent = redisTemplate.opsForValue()
                .setIfAbsent(redisKey, "1", REPEAT_INTERVAL, TimeUnit.MILLISECONDS);

        if (Boolean.FALSE.equals(absent)) {
            log.warn("重复提交拦截: user={}, uri={}", userIdStr, uri);
            throw new BusinessException(429, "请勿重复提交");
        }

        return true;
    }
}
