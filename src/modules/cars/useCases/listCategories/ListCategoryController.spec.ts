import { hash } from 'bcrypt';
import { v4 as uuidV4 } from 'uuid';
import { app } from "@shared/infra/http/app";
import request from "supertest";
import createConnection from "@shared/infra/typeorm";
import { Connection } from "typeorm";

let connection: Connection;

describe("List Categories",()=>{
    beforeAll(async ()=>{
        connection = await createConnection();
        await connection.runMigrations();
        const id = uuidV4();
        const password = await hash("admin",8);
    
        await connection.query(
            `INSERT INTO USERS(id,name,email,password,"isAdmin",created_at,driver_license)
            values('${id}', 'admin', 'admin@rentx.com.br', '${password}', true,'now()','xxxxxxx')
            `
        );
    
    })

    afterAll(async ()=>{
        await connection.dropDatabase();
        await connection.close();
    })

    it("should be able to list all categories",async()=>{

        const responseToken =  await request(app).post("/sessions").send({
            email:"admin@rentx.com.br",
            password:"admin"
        })
 
        const {refresh_token}= responseToken.body;

      
 
        await request(app).post("/categories").send({
             name: "category supertest",
             description:"category supertest"
         }).set({
             Authorization: `Bearer ${refresh_token}`
         })
 
         const response = await request(app).get("/categories").set({
            Authorization: `Bearer ${refresh_token}`
        });

         
         expect(response.status).toBe(200);
         

     })
 
})