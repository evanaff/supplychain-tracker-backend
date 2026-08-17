import dotenv from 'dotenv';

dotenv.config();

const config = {
    app: {
        host: process.env.HOST,
        port: Number(process.env.PORT) || 5000,
        clientUrl: process.env.CLIENT_URL || '',
        domainName: process.env.DOMAIN_NAME,
    },
    db: {
        url: process.env.DATABASE_URL
    },
    jwt: {
        secret: process.env.JWT_SECRET
    },
    contract: {
        address: process.env.CONTRACT_ADDRESS || '',
        adminPrivateKey: process.env.ADMIN_PRIVATE_KEY || ''
    },
    rpc: {
        url: process.env.RPC_URL
    },
    supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceKey: process.env.SUPABASE_SERVICE_KEY || ''
    }
}

export default config;