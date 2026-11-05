import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import { UMB_PROPERTY_CONTEXT } from '@umbraco-cms/backoffice/property';

class AntcRiskPropertyAppearance extends UmbControllerBase {
    constructor(host) {
        super(host);
        this.consumeContext(UMB_PROPERTY_CONTEXT, context => context?.setAppearance({ ...context.getAppearance(), labelOnTop: true }));
    }
}
export { AntcRiskPropertyAppearance as api };
