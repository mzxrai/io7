import styles from './TermsOfService.module.css';

export class TermsOfService extends HTMLElement {
  connectedCallback(): void {
    this.render();
  }

  private render(): void {
    this.className = styles.host;
    
    this.innerHTML = `
      <div class="${styles.container}">
        <div class="${styles.content}">
          <h1 class="${styles.title}">Terms of Service</h1>
          <p class="${styles.lastUpdated}">Last Updated: August 2025</p>
          
          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">1. Acceptance of Terms</h2>
            <p class="${styles.paragraph}">
              By using io7 ("the Service"), you agree to these Terms of Service. io7 is an open source registry 
              of subagents. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">2. Description of Service</h2>
            <p class="${styles.paragraph}">
              io7 is an open source registry that allows users to browse and discover subagents. These subagents 
              are specialized tools that users can install at their own discretion. The Service provides information 
              and installation commands but does not directly install or execute any code.
            </p>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">3. Disclaimer of Warranties</h2>
            <p class="${styles.paragraph}">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
              We do not warrant that the Service will be uninterrupted, error-free, or that any subagents will meet 
              your requirements or operate without errors.
            </p>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">4. Limitation of Liability</h2>
            <p class="${styles.paragraph}">
              IN NO EVENT SHALL IO7, ITS CREATORS, CONTRIBUTORS, OR AFFILIATES BE LIABLE FOR ANY DIRECT, INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE OR ANY 
              SUBAGENTS INSTALLED THROUGH THE SERVICE.
            </p>
            <p class="${styles.paragraph}">
              This includes, but is not limited to, damages for loss of profits, data, or other intangible losses, 
              even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">5. Third-Party Content</h2>
            <p class="${styles.paragraph}">
              Subagents available through io7 may be created by third parties. We do not endorse, guarantee, or 
              assume responsibility for the accuracy, completeness, or usefulness of any subagent. You use all 
              subagents at your own risk.
            </p>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">6. User Responsibilities</h2>
            <p class="${styles.paragraph}">
              You are responsible for:
            </p>
            <ul class="${styles.list}">
              <li>Reviewing subagent code before installation</li>
              <li>Ensuring subagents are appropriate for your use case</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Maintaining the security of your own systems</li>
            </ul>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">7. Indemnification</h2>
            <p class="${styles.paragraph}">
              You agree to indemnify and hold harmless io7 and its creators from any claims, damages, losses, or 
              expenses arising from your use of the Service or any subagents installed through it.
            </p>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">8. Modifications</h2>
            <p class="${styles.paragraph}">
              We reserve the right to modify these Terms of Service at any time. Continued use of the Service after 
              changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">9. Governing Law</h2>
            <p class="${styles.paragraph}">
              These terms shall be governed by the laws of the United States, without regard to conflict of law principles.
            </p>
          </section>

          <section class="${styles.section}">
            <h2 class="${styles.sectionTitle}">10. Contact</h2>
            <p class="${styles.paragraph}">
              For questions about these Terms of Service, please open an issue on our 
              <a href="https://github.com/mzxrai/io7" target="_blank" rel="noopener noreferrer" class="${styles.link}">GitHub repository</a>.
            </p>
          </section>

        </div>
      </div>
    `;
  }
}

customElements.define('terms-of-service', TermsOfService);