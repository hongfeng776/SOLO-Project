package com.cuyan.interceptor;

import com.cuyan.common.BusinessException;
import com.cuyan.common.ResultCode;
import com.cuyan.common.UserContext;
import com.cuyan.config.JwtConfig;
import com.cuyan.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Date;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final JwtConfig jwtConfig;
    private final StringRedisTemplate redisTemplate;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader(jwtConfig.getHeader());

        if (token == null || token.isEmpty()) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        if (token.startsWith(jwtConfig.getPrefix() + " ")) {
            token = token.substring(jwtConfig.getPrefix().length() + 1);
        }

        Claims claims;
        try {
            claims = jwtUtil.parseToken(token);
        } catch (ExpiredJwtException e) {
            throw new BusinessException(ResultCode.TOKEN_EXPIRED);
        } catch (JwtException e) {
            throw new BusinessException(ResultCode.TOKEN_INVALID);
        }

        if (claims.getExpiration().before(new Date())) {
            throw new BusinessException(ResultCode.TOKEN_EXPIRED);
        }

        Long userId = claims.get("userId", Long.class);
        String username = claims.get("username", String.class);

        String redisToken = redisTemplate.opsForValue().get("login:token:" + userId);
        if (redisToken == null || !redisToken.equals(token)) {
            throw new BusinessException(ResultCode.TOKEN_INVALID);
        }

        UserContext.setUserId(userId);
        UserContext.setUsername(username);

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
