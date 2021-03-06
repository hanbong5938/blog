import jwt from 'jsonwebtoken';
import User from '../models/user';

const jwtMiddleware = async (ctx, next) => {
    const token = ctx.cookies.get('access_token');
    if (!token) return next();//토큰 없는 경우
    try {
        //decoded 에 _id, username, iat, exp가 존재하는데 iat는 토큰이 만들어진 시간, exp는 만료되는 시간
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ctx.state.user = {
            _id: decoded._id,
            username: decoded.username,
        };
        //남은 토큰의 유효기간이 3.5미만이면 재발급
        const now = Math.floor(Date.now()/1000);
        if(decoded.exp - now < 1000* 60 * 60 * 24 * 3.5){
            const user = await User.findById(decoded._id);
            const token = user.generateToken();
            ctx.cookies.set('access_token', token, {
                maxAge: 1000* 60 * 60 * 24 * 15,
                httpOnly: true,
            })
        }
        return next();
    } catch (e) {
        //검증 실패
        return next();
    }
};

export default jwtMiddleware;