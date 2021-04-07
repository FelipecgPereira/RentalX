import { DayjsDateProvider } from '@shared/container/providers/DateProvider/implementations/DayjsDateProvider';


import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { injectable } from "tsyringe";
import { inject } from "tsyringe";

import { IUserRepository } from "@modules/accounts/repositories/IUsersRepository";
import { AppError } from "@shared/errors/AppError";
import { IUsersTokensRepository } from "@modules/accounts/repositories/IUsersTokensRepository";
import auth from "@config/auth";
import { IDateProvider } from '@shared/container/providers/DateProvider/IDateProvider';



interface IRequest{
    email: string,
    password: string
}

interface IResponse{
    user:{
        name: string,
        email: string
    },
    token: string,
    refresh_token: string;
}

@injectable()
class AuthenticateUserUseCase{

    constructor(
        @inject("UsersRepository")
        private usersRepository: IUserRepository,
        @inject("UsersTokensRepository")
        private usersTokensRepository: IUsersTokensRepository,
        @inject("DayjsDateProvider")
        private dayjsDateProvider:IDateProvider
    ){}

    async execute({email, password}:IRequest):Promise<IResponse>{
        const user = await this.usersRepository.findByEmail(email);
        const {
            secret_token,
            expires_in_token,
            secret_refresh_token,
            expires_in_refresh_token,
            expires_refresh_token_days
        } = auth;

        if(!user){
            throw new AppError("Email or Password incorrect!");
        }
        const passwordMatch =await compare(password,user.password);
        
        if(!passwordMatch){
            throw new AppError("Email or Password incorrect!");
        }

        const token = sign({},secret_token,{
            subject: user.id,
            expiresIn: expires_in_token
        });

        const refresh_token = sign({ email },secret_refresh_token,{
            subject: user.id,
            expiresIn:expires_in_refresh_token,
        });

        const refresh_token_expires_date = this.dayjsDateProvider.addDays(expires_refresh_token_days)

        await this.usersTokensRepository.create({
            user_id: user.id,
            refresh_token,
            expires_date:refresh_token_expires_date,
        })

        const tokenReturn: IResponse={
            token,
            user:{
                name: user.name,
                email: user.email
            },
            refresh_token
        }

        return tokenReturn;
    }
}

export {AuthenticateUserUseCase}