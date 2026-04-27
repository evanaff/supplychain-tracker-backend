import dotenv from 'dotenv';

dotenv.config();

interface Config {
    app: {
        host: string,
        port: number,
        clientUrl: string,
        domainName: string
    },
    db: {
        url: string
    },
    jwt: {
        secret?: string
    }
    contract: {
        address: string,
        privateKey: string
    },
    rpc: {
        provider: string
    }
}

const config: Config = {
    app: {
        host: process.env.HOST || 'localhost',
        port: Number(process.env.PORT) || 5000,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        domainName: process.env.DOMAIN_NAME || 'localhost:3000'
    },
    db: {
        url: process.env.DATABASE_URL || ''
    },
    jwt: {
        secret: process.env.JWT_SECRET
    },
    contract: {
        address: process.env.CONTRACT_ADDRESS || '',
        privateKey: process.env.CONTRACT_PRIVATE_KEY || ''
    },
    rpc: {
        provider: process.env.JSON_RPC_PROVIDER || 'http://127.0.0.1:8545'
    }
}

export default config;