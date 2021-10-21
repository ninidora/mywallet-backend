import connection from "../database/database.js";
import { activitySchema } from '../validation/schemas.js'

async function activityPost (req, res) {

    const {
        valor,
        entrada,
        saida,
        data,
        descricao
    } = req.body

    const errors = activitySchema.validate(
        {
            valor,
            entrada,
            saida,
            data,
            descricao
        }).error;

    if(errors){
        console.log(errors)
    }

    const authorization = req.headers['authorization'];
    const token = authorization?.replace('Bearer ', '');

    if(!token) return res.sendStatus(401);

    const result = await connection.query(`
        SELECT * FROM sessions
        JOIN clientes
        ON sessions.user_id = clientes.id
        WHERE sessions.token = $1
  `, [token]);

    const user = result.rows[0];

    if(user) {

    try {
        await connection.query(`
        INSERT INTO movimento (valor, entrada, saida, data, descricao, user_id) VALUES ($1, $2, $3, $4, $5, $6);
        `, [valor, entrada, saida, data, descricao, user.id]);

        res.sendStatus(200)

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }   

    } else {
        res.sendStatus(401);
    }

}

async function activityList (req, res) {

    const authorization = req.headers['authorization'];
    const token = authorization?.replace('Bearer ', '');

    if(!token) return res.sendStatus(401);

    const result = await connection.query(`
        SELECT * FROM sessions
        JOIN clientes
        ON sessions.user_id = clientes.id
        WHERE sessions.token = $1
  `, [token]);

    const user = result.rows[0];

    if(user) {
        
        try {
            const result = await connection.query(`SELECT * FROM movimento WHERE user_id = $1;`, [user.id]);
    
            // result.rows = result.rows.map(value => ({
            //     ...value,
            //     data: new Date(value.data).toLocaleDateString('pt-Br')
            //   }))

            const resultFormated = result.rows.map(r => (
                {
                 valor: r.valor,
                 entrada: r.entrada,
                 saida: r.saida,
                 data: new Date(r.data).toLocaleDateString('pt-Br'),
                 descricao: r.descricao
                }
            ))
    
            return res.send(resultFormated);
              
        } catch (error) {
            console.log(error)
            res.sendStatus(500)
        } 

    } else {
        res.sendStatus(401);
    }
      
}

export{
    activityPost,
    activityList
}

