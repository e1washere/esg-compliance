-- ESG Compliance Platform Database Schema
-- PostgreSQL 15+

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS esg;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path
SET search_path TO esg, public;

-- Organizations table (SMEs)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    nip VARCHAR(20) UNIQUE NOT NULL, -- Polish Tax ID
    regon VARCHAR(14), -- Polish Business Registry Number
    krs VARCHAR(20), -- National Court Register number
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(10),
    address_voivodeship VARCHAR(50), -- Polish administrative division
    industry_code VARCHAR(10), -- PKD code
    industry_name VARCHAR(255),
    company_size VARCHAR(20) CHECK (company_size IN ('micro', 'small', 'medium')),
    employee_count INTEGER,
    annual_revenue DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'PLN',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    founded_date DATE,
    subscription_tier VARCHAR(50) CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
    subscription_status VARCHAR(20) CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
    department VARCHAR(100),
    position VARCHAR(100),
    language VARCHAR(5) DEFAULT 'pl',
    timezone VARCHAR(50) DEFAULT 'Europe/Warsaw',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    verification_token VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ESG Categories
CREATE TABLE esg_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name_pl VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    category_type VARCHAR(20) CHECK (category_type IN ('environmental', 'social', 'governance')),
    parent_id UUID REFERENCES esg_categories(id),
    level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Requirements (Polish and EU regulations)
CREATE TABLE compliance_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_pl VARCHAR(500) NOT NULL,
    name_en VARCHAR(500),
    description_pl TEXT,
    description_en TEXT,
    category_id UUID REFERENCES esg_categories(id),
    regulation_type VARCHAR(50) CHECK (regulation_type IN ('eu', 'polish', 'industry')),
    regulation_name VARCHAR(255), -- e.g., 'CSRD', 'Polish Environmental Law'
    article_reference VARCHAR(100),
    effective_date DATE,
    deadline_type VARCHAR(50), -- 'annual', 'quarterly', 'monthly', 'one-time'
    applies_to_size VARCHAR(20)[], -- array of 'micro', 'small', 'medium'
    applies_to_industries VARCHAR(10)[], -- array of PKD codes
    penalty_amount DECIMAL(12,2),
    penalty_currency VARCHAR(3) DEFAULT 'PLN',
    measurement_unit VARCHAR(50),
    threshold_value DECIMAL(15,4),
    threshold_operator VARCHAR(10), -- '>', '<', '>=', '<=', '='
    is_mandatory BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Assessments
CREATE TABLE compliance_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES compliance_requirements(id),
    assessment_period_start DATE NOT NULL,
    assessment_period_end DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('compliant', 'non_compliant', 'partial', 'pending', 'not_applicable')),
    score DECIMAL(5,2), -- 0-100
    current_value DECIMAL(15,4),
    target_value DECIMAL(15,4),
    evidence_url TEXT[],
    notes TEXT,
    assessed_by UUID REFERENCES users(id),
    assessed_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    next_assessment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ESG Metrics Data
CREATE TABLE esg_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES esg_categories(id),
    period_type VARCHAR(20) CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    -- Environmental metrics
    energy_consumption_kwh DECIMAL(15,2),
    renewable_energy_kwh DECIMAL(15,2),
    water_consumption_m3 DECIMAL(15,2),
    waste_generated_kg DECIMAL(15,2),
    waste_recycled_kg DECIMAL(15,2),
    co2_emissions_tons DECIMAL(15,4),
    -- Social metrics
    employee_turnover_rate DECIMAL(5,2),
    training_hours_per_employee DECIMAL(10,2),
    workplace_accidents INTEGER,
    gender_diversity_ratio DECIMAL(5,2),
    -- Governance metrics
    board_meetings_count INTEGER,
    ethics_violations_count INTEGER,
    data_breaches_count INTEGER,
    -- Custom fields as JSONB
    custom_metrics JSONB,
    data_source VARCHAR(100),
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, metric_type, period_start, period_end)
);

-- Utility Provider Integrations
CREATE TABLE utility_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) CHECK (provider_type IN ('electricity', 'gas', 'water', 'waste', 'heating')),
    api_endpoint VARCHAR(500),
    api_version VARCHAR(20),
    authentication_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization Utility Connections
CREATE TABLE organization_utilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES utility_providers(id),
    account_number VARCHAR(100),
    meter_number VARCHAR(100),
    api_key_encrypted TEXT,
    connection_status VARCHAR(50) CHECK (connection_status IN ('connected', 'pending', 'failed', 'disconnected')),
    last_sync_at TIMESTAMP,
    sync_frequency_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    report_type VARCHAR(50) CHECK (report_type IN ('compliance', 'esg_summary', 'regulatory', 'custom')),
    title VARCHAR(500),
    period_start DATE,
    period_end DATE,
    status VARCHAR(50) CHECK (status IN ('draft', 'generating', 'completed', 'submitted', 'failed')),
    file_path TEXT,
    file_size_bytes BIGINT,
    format VARCHAR(20) CHECK (format IN ('pdf', 'excel', 'csv', 'xml')),
    language VARCHAR(5) DEFAULT 'pl',
    regulatory_body VARCHAR(255), -- e.g., 'Ministry of Climate', 'KNF'
    submission_deadline DATE,
    submitted_at TIMESTAMP,
    submission_reference VARCHAR(255),
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Recommendations
CREATE TABLE ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES esg_categories(id),
    requirement_id UUID REFERENCES compliance_requirements(id),
    recommendation_type VARCHAR(50) CHECK (recommendation_type IN ('improvement', 'compliance', 'cost_saving', 'risk_mitigation')),
    title_pl VARCHAR(500),
    description_pl TEXT,
    priority VARCHAR(20) CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    estimated_cost DECIMAL(12,2),
    estimated_savings DECIMAL(12,2),
    implementation_time_days INTEGER,
    potential_score_improvement DECIMAL(5,2),
    status VARCHAR(50) CHECK (status IN ('new', 'viewed', 'accepted', 'rejected', 'implemented')),
    ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    viewed_at TIMESTAMP,
    actioned_by UUID REFERENCES users(id),
    actioned_at TIMESTAMP,
    feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title_pl VARCHAR(500),
    message_pl TEXT,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50),
    related_entity_type VARCHAR(100),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys for external integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification
    permissions JSONB,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_organizations_nip ON organizations(nip);
CREATE INDEX idx_organizations_subscription ON organizations(subscription_status, subscription_tier);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_compliance_assessments_org ON compliance_assessments(organization_id);
CREATE INDEX idx_compliance_assessments_status ON compliance_assessments(status);
CREATE INDEX idx_esg_metrics_org_period ON esg_metrics(organization_id, period_start, period_end);
CREATE INDEX idx_reports_org_type ON reports(organization_id, report_type);
CREATE INDEX idx_ai_recommendations_org ON ai_recommendations(organization_id, status);
CREATE INDEX idx_audit_log_org_user ON audit.audit_log(organization_id, user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_requirements_updated_at BEFORE UPDATE ON compliance_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_assessments_updated_at BEFORE UPDATE ON compliance_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_esg_metrics_updated_at BEFORE UPDATE ON esg_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_utilities_updated_at BEFORE UPDATE ON organization_utilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies would be added here for multi-tenant isolation