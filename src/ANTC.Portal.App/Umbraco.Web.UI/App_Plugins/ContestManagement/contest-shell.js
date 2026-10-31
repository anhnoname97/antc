import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import './contest-theme.js?v=1.15.8';

// The section context owns these shell tokens and releases them on navigation.
// Native Umbraco navigation, search and permissions remain in control of the shell.
export default class ContestShell extends UmbControllerBase {
    constructor(host) {
        super(host);
        if (!document.querySelector('#antc-contest-shell-theme')) {
            const style = document.createElement('style'); style.id = 'antc-contest-shell-theme';
            style.textContent = `html[data-antc-contest-section] {
                --umb-header-background-color:#0B3B3A;
                --uui-color-header-surface:#0B3B3A; --uui-color-header-background:#0B3B3A;
                --uui-color-header-contrast:#DFEEEB; --uui-color-header-contrast-emphasis:#fff;
                --uui-font-family:'Roboto',Arial,sans-serif;
                --uui-color-selected:#E3F4F1; --uui-color-selected-emphasis:#C7E9E3;
                --uui-color-selected-contrast:#0A5E57;
                --uui-color-current:#E3F4F1; --uui-color-current-emphasis:#C7E9E3;
                --uui-color-current-contrast:#0A5E57;
                --uui-color-interactive:#0E7C72; --uui-color-interactive-emphasis:#0A5E57;
                --uui-color-focus:#0E7C72;
            }`;
            document.head.append(style);
        }
        document.documentElement.dataset.antcContestSection = '';
    }
    destroy() {
        delete document.documentElement.dataset.antcContestSection;
        super.destroy();
    }
}
