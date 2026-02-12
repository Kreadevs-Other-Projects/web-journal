CREATE Table IF NOT EXISTS otp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expiry_at TIMESTAMP NOT NULL,

    CONSTRAINT chk_otp_expiry
        CHECK (expiry_at > created_at),

    CONSTRAINT uq_email_otp
        UNIQUE (email)    
);