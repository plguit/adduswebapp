import React from 'react';
import { Home } from 'lucide-react';

/**
 * TODO: The draft Terms & Conditions and Privacy Policy below must be reviewed by qualified legal counsel
 * before the production launch of the ADDUS platform.
 */

export function LegalPages({ type = 'terms', onBack }) {
  if (type === 'privacy') {
    return (
      <div className="legal-page-viewport fade-in" style={{ padding: '24px', color: '#FFF', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <style>{`
          .legal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 24px; }
          .legal-title { font-size: 24px; font-weight: 800; background: linear-gradient(to right, #FFF, #00D1FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .legal-meta { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
          .legal-section { margin-bottom: 24px; }
          .legal-section-title { font-size: 16px; font-weight: 700; color: #00D1FF; margin-bottom: 8px; border-left: 3px solid #00D1FF; padding-left: 10px; }
          .legal-text { font-size: 13.5px; color: #D1D5DB; line-height: 1.6; margin: 0; }
          .legal-bullet-list { margin: 8px 0; padding-left: 20px; }
          .legal-bullet-item { font-size: 13.5px; color: #D1D5DB; line-height: 1.6; margin-bottom: 4px; }
        `}</style>
        <div className="legal-header">
          <div>
            <h1 className="legal-title">ADDUS Privacy Policy</h1>
            <p className="legal-meta">Draft Document · Effective Date: August 9, 2026</p>
          </div>
          {onBack && (
            <button className="duolingo-secondary-btn micro-btn flex-center" onClick={onBack} style={{ gap: '6px' }}>
              <Home size={14} /> Back
            </button>
          )}
        </div>

        <div className="legal-content">
          <div className="legal-section">
            <h3 className="legal-section-title">1. Introduction</h3>
            <p className="legal-text">
              This Privacy Policy describes how ADDUS ("we", "us", or "our") collects, handles, processes, and protects information submitted by users through our platform.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">2. Information We May Collect</h3>
            <p className="legal-text">
              Depending on your interactions with the platform, we may collect the following information:
            </p>
            <ul className="legal-bullet-list">
              <li className="legal-bullet-item">Your name, phone number, and email address.</li>
              <li className="legal-bullet-item">Your business/company name, website URL, industry type, and segment details.</li>
              <li className="legal-bullet-item">Business information, descriptions, strategic targets, and product parameters.</li>
              <li className="legal-bullet-item">Uploaded materials including images, PDF guidelines, logos, and reference materials.</li>
              <li className="legal-bullet-item">Onboarding responses, project parameters, preferred schedule requests, and billing context.</li>
              <li className="legal-bullet-item">Conversations, requests, and feedback messages exchanged with ADDI and our expert team.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">3. How We Use Information</h3>
            <p className="legal-text">
              We process your information for the following specific purposes:
            </p>
            <ul className="legal-bullet-list">
              <li className="legal-bullet-item">To set up, authenticate, and manage your ADDUS user account.</li>
              <li className="legal-bullet-item">To analyze your business profile and generate AI-assisted recommendations.</li>
              <li className="legal-bullet-item">To schedule and coordinate visual production, design, and website development services.</li>
              <li className="legal-bullet-item">To facilitate communications, project revision requests, and administrative operations.</li>
              <li className="legal-bullet-item">To compile and manage published project quotations, templates, and deliverable handoffs.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">4. AI Processing</h3>
            <p className="legal-text">
              Business descriptions and goals submitted during onboarding are processed by AI models to formulate automated strategies and recommendations. These AI outcomes represent operational suggestions and are not guaranteed to be free of errors.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">5. Uploaded Content</h3>
            <p className="legal-text">
              Any files, websites, or images uploaded to the Business Vault are preserved securely. You must ensure you possess the appropriate licenses and sharing rights for any third-party materials uploaded.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">6. Information Sharing</h3>
            <p className="legal-text">
              Your business profiles and request details are accessible only by authorized ADDUS administrators, project strategists, and assigned creative producers. We do not sell or lease your business details.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">7. Data Retention</h3>
            <p className="legal-text">
              We retain account information, assets, and project logs for as long as your account remains active or as required to fulfill service deliverables. Retention policies for inactive accounts will be updated as the platform evolves.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">8. Security</h3>
            <p className="legal-text">
              We apply industry-standard electronic safeguards to protect user information from unauthorized access. However, no database transmission over the internet can be declared absolutely secure.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">9. User Rights & Requests</h3>
            <p className="legal-text">
              You can view, update, and request modification of your personal contact information and uploaded vault assets directly inside the profile tab. For account deletion or correction inquiries, reach out to us at our support contact.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">10. Cookies & Local Storage</h3>
            <p className="legal-text">
              We utilize browser localStorage to preserve active session status and your progress during the conversational onboarding steps to prevent page refresh logouts.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">11. Policy Updates</h3>
            <p className="legal-text">
              This Privacy Policy may be updated periodically to align with legal compliance requirements. The latest version will always be published on this page.
            </p>
          </div>

          <div className="legal-section">
            <h3 className="legal-section-title">12. Contact Information</h3>
            <p className="legal-text">
              If you have questions regarding data privacy or want to exercise your information rights, contact us at: <a href="mailto:addusindia@gmail.com" style={{ color: '#00D1FF', textDecoration: 'none' }}>addusindia@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Terms and Conditions view
  return (
    <div className="legal-page-viewport fade-in" style={{ padding: '24px', color: '#FFF', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        .legal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; margin-bottom: 24px; }
        .legal-title { font-size: 24px; font-weight: 800; background: linear-gradient(to right, #FFF, #7C5CFF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .legal-meta { font-size: 12px; color: #9CA3AF; margin-top: 4px; }
        .legal-section { margin-bottom: 24px; }
        .legal-section-title { font-size: 16px; font-weight: 700; color: #7C5CFF; margin-bottom: 8px; border-left: 3px solid #7C5CFF; padding-left: 10px; }
        .legal-text { font-size: 13.5px; color: #D1D5DB; line-height: 1.6; margin: 0; }
        .legal-bullet-list { margin: 8px 0; padding-left: 20px; }
        .legal-bullet-item { font-size: 13.5px; color: #D1D5DB; line-height: 1.6; margin-bottom: 4px; }
      `}</style>
      <div className="legal-header">
        <div>
          <h1 className="legal-title">ADDUS Terms & Conditions</h1>
          <p className="legal-meta">Draft Document · Effective Date: August 9, 2026</p>
        </div>
        {onBack && (
          <button className="duolingo-secondary-btn micro-btn flex-center" onClick={onBack} style={{ gap: '6px' }}>
            <Home size={14} /> Back
          </button>
        )}
      </div>

      <div className="legal-content">
        <div className="legal-section">
          <h3 className="legal-section-title">1. Introduction</h3>
          <p className="legal-text">
            ADDUS provides a collaborative platform where businesses can submit company details, access AI-assisted recommendations via our ADDI assistant, submit requests for creative services, coordinate schedule bookings, and access final digital deliverables.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">2. Acceptance of Terms</h3>
          <p className="legal-text">
            By creating an account, verifying OTP, or using the ADDUS platform, you explicitly agree to follow and be bound by these Terms & Conditions.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">3. Account & User Responsibility</h3>
          <p className="legal-text">
            Users must provide authentic and accurate company credentials. You agree to safeguard your OTP verification number and are prohibited from impersonating any other business entity or submitting unauthorized details.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">4. Business Information & Assets</h3>
          <p className="legal-text">
            You may upload materials like logos, screenshots, brand guidelines, and product information to the Business Vault. By uploading, you warrant that you possess all necessary licensing rights and permissions for these assets.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">5. AI-Assisted Recommendations</h3>
          <p className="legal-text">
            Automated recommendations provided by ADDI are strategic suggestions intended for helper guidance. They do not constitute guaranteed commercial outcomes, regulatory filings, or certified legal/financial counsel.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">6. Services, Scope & Quotations</h3>
          <p className="legal-text">
            Onboarding service selections are requests. Final scope details may require administrative review. Any pricing, budgets, or ranges displayed on draft steps are pending until an official quotation is reviewed and approved by the admin.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">7. Scheduling</h3>
          <p className="legal-text">
            Date selections submitted during onboarding represent customer preferences. The final shoot or delivery calendar dates are officially confirmed by the administrator after assessing crew allocation and production dependencies.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">8. Deliverables & Revisions</h3>
          <p className="legal-text">
            The delivery of finished brand assets, source packages, and the quantity of client revision cycles are governed explicitly by the final approved quotation.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">9. Customer Communication</h3>
          <p className="legal-text">
            Customers may request updates, campaign expansions, or timeline modifications directly through our chat rooms. Admins will coordinate response messages using the platform communication stream.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">10. Intellectual Property</h3>
          <p className="legal-text">
            Ownership and licensing rights to final website code, photography layers, vectors, and video assets are defined individually in each project contract and depend on the completion of the agreed payments.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">11. Third-Party Materials</h3>
          <p className="legal-text">
            Users remain completely liable for securing any rights and clearances for fonts, background music, or packaging templates they request us to incorporate into creative deliverables.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">12. Platform Availability</h3>
          <p className="legal-text">
            We do not guarantee uninterrupted access to the platform. ADDUS reserves the right to suspend or restrict platform features for server updates, backups, and security patching.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">13. Prohibited Use</h3>
          <p className="legal-text">
            You agree not to use this service for fraudulent operations, copyright infringement, keyboard spam, or publishing malicious code.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">14. Account Suspension & Termination</h3>
          <p className="legal-text">
            We reserve the right to suspend or terminate account access if a violation of these terms, duplicate account fraud, or unlawful activity is detected.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">15. Limitation & Disclaimer</h3>
          <p className="legal-text">
            This platform is provided "as is" during the MVP release. We make no representations or warranties regarding sales conversion rates, digital growth spikes, Google rankings, or production timelines.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">16. Changes to Terms</h3>
          <p className="legal-text">
            ADDUS reserves the right to modify these Terms & Conditions. Continued usage of our website indicates your consent to the modified terms.
          </p>
        </div>

        <div className="legal-section">
          <h3 className="legal-section-title">17. Contact Information</h3>
          <p className="legal-text">
            For terms enforcement, notifications, and customer support, reach out to: <a href="mailto:addusindia@gmail.com" style={{ color: '#7C5CFF', textDecoration: 'none' }}>addusindia@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
