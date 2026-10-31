import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UMB_PROPERTY_CONTEXT } from '@umbraco-cms/backoffice/property';

export const ANTC_ARTICLE_COMPOSE_CONTEXT = new UmbContextToken('AntcArticleComposeContext');

const descriptions = {
  summary: '1–2 câu giới thiệu bài.',
  body: '',
  image: '',
  imageAlt: 'Mô tả ngắn nội dung ảnh. Có thể để trống.',
  safeAction: 'Không bắt buộc.',
  sourceAgency: '',
  sourceDocNo: '',
  sourceDocDate: '',
  labelType: '',
  updatedDate: 'Dùng để sắp xếp bài viết.',
  showOnHome: 'Áp dụng sau khi xuất bản.',
  seoTitle: 'Để trống để dùng tên bài viết.',
  seoDescription: 'Để trống để dùng tóm tắt.',
  ogImage: 'Trống: dùng ảnh bài viết hoặc ảnh mặc định.',
};

// Rut gon huong dan trong Soan bai; mo ta anh khong con la dieu kien xuat ban.
class AntcArticleFieldDescriptionContext extends UmbControllerBase {
  constructor(host) {
    super(host);
    this.consumeContext(UMB_PROPERTY_CONTEXT, property => {
      this._property = property;
      this.observe(property?.alias, alias => {
        this._alias = alias;
        this._updateDescription();
      }, 'article-field-description');
    });
    this.consumeContext(ANTC_ARTICLE_COMPOSE_CONTEXT, compose => {
      this._compose = compose;
      this._updateDescription();
    });
  }

  _updateDescription() {
    if ((this._compose || this._alias === 'imageAlt') && Object.hasOwn(descriptions, this._alias)) {
      this._property?.setDescription(descriptions[this._alias]);
    }
  }
}

export { AntcArticleFieldDescriptionContext as api };
