# Sơ đồ project ANTC Portal

> File này **tự sinh** bằng `python docs/so-do/gen_so_do.py`. Đừng sửa tay; chạy lại script sau khi đổi cấu trúc.
> GitLab/GitHub/VS Code (Markdown Preview Mermaid) tự vẽ các khối Mermaid bên dưới.

## 1. Quan hệ giữa các project .NET

```mermaid
graph LR
  Umbraco_Plugin_Custom_Api["Umbraco.Plugin.Custom.Api"]
  Umbraco_Plugin_Custom_Api --> Umbraco_Plugin_Custom_Core
  Umbraco_Plugin_Custom_Api -.-> pkg_Umbraco_Cms(["Umbraco.Cms"])
  Umbraco_Plugin_Custom_Core["Umbraco.Plugin.Custom.Core"]
  Umbraco_Plugin_Custom_Core -.-> pkg_Umbraco_Cms(["Umbraco.Cms"])
  Umbraco_Plugin_Custom_Core -.-> pkg_Microsoft_EntityFrameworkCore_Sqlite(["Microsoft.EntityFrameworkCore.Sqlite"])
  Umbraco_Plugin_Custom_Tests["Umbraco.Plugin.Custom.Tests"]
  Umbraco_Plugin_Custom_Tests --> Umbraco_Plugin_Custom_Api
  Umbraco_Plugin_Custom_Tests --> Umbraco_Plugin_Custom_Core
  Umbraco_Plugin_Custom_Tests --> Umbraco_Web_UI
  Umbraco_Plugin_Custom_Tests -.-> pkg_xunit(["xunit"])
  Umbraco_Web_UI["Umbraco.Web.UI"]
  Umbraco_Web_UI --> Umbraco_Plugin_Custom_Core
  Umbraco_Web_UI --> Umbraco_Plugin_Custom_Api
  Umbraco_Web_UI -.-> pkg_Umbraco_Cms(["Umbraco.Cms"])
  Umbraco_Web_UI -.-> pkg_uSync(["uSync"])
```

## 2. Document type dạng trang (uSync)

Mũi tên liền = được phép tạo con; nét đứt = composition hoặc template.

```mermaid
graph TD
  antc["An toàn tài chính<br/><i>antc</i>"]
  article["Bài viết<br/><i>article</i>"]
  articleList["Danh mục bài viết<br/><i>articleList</i>"]
  articleManagement["Kho Thủ đoạn<br/><i>articleManagement</i>"]
  chinhSachPage["Trang Chính sách<br/><i>chinhSachPage</i>"]
  contentManagement["Quản lý nội dung<br/><i>contentManagement</i>"]
  cuocThiLamBaiPage["Trang Làm bài cuộc thi<br/><i>cuocThiLamBaiPage</i>"]
  fraudContent["Nội dung giới thiệu Thủ đoạn<br/><i>fraudContent</i>"]
  hoiDapPage["Trang Hỏi – Đáp<br/><i>hoiDapPage</i>"]
  home["Trang chủ (Giới thiệu)<br/><i>home</i>"]
  pageManagement["Quản lý trang<br/><i>pageManagement</i>"]
  policyContent["Nội dung giới thiệu Chính sách<br/><i>policyContent</i>"]
  qaItem["Câu trả lời công khai<br/><i>qaItem</i>"]
  searchPage["Trang Tìm kiếm<br/><i>searchPage</i>"]
  seoBase["SEO dùng chung<br/><i>seoBase</i>"]
  thamGiaPage["Trang Tham gia<br/><i>thamGiaPage</i>"]
  thiPage["Trang Cuộc thi<br/><i>thiPage</i>"]
  thiThangPage["Trang Cuộc thi tháng<br/><i>thiThangPage</i>"]
  thiThuPage["Trang Thử sức<br/><i>thiThuPage</i>"]
  thuDoanPage["Trang Thủ đoạn<br/><i>thuDoanPage</i>"]
  ungPhoPage["Trang Ứng phó khẩn cấp<br/><i>ungPhoPage</i>"]
  antc --> pageManagement
  antc --> contentManagement
  article -.-> tpl_article{{"article.cshtml"}}
  articleList --> article
  articleList -.-> tpl_articleList{{"articleList.cshtml"}}
  articleManagement --> articleList
  articleManagement --> fraudContent
  chinhSachPage -. composition .-> seoBase
  chinhSachPage -.-> tpl_chinhSachPage{{"chinhSachPage.cshtml"}}
  contentManagement --> articleManagement
  contentManagement --> articleList
  contentManagement --> policyContent
  cuocThiLamBaiPage -. composition .-> seoBase
  cuocThiLamBaiPage -.-> tpl_cuocThiLamBaiPage{{"cuocThiLamBaiPage.cshtml"}}
  hoiDapPage -. composition .-> seoBase
  hoiDapPage -.-> tpl_hoiDapPage{{"hoiDapPage.cshtml"}}
  home --> ungPhoPage
  home --> thuDoanPage
  home --> thamGiaPage
  home --> thiThuPage
  home --> thiPage
  home --> hoiDapPage
  home --> chinhSachPage
  home --> searchPage
  home --> thiThangPage
  home -. composition .-> seoBase
  home -.-> tpl_home{{"home.cshtml"}}
  pageManagement --> home
  qaItem -. composition .-> seoBase
  searchPage -. composition .-> seoBase
  searchPage -.-> tpl_searchPage{{"searchPage.cshtml"}}
  thamGiaPage -. composition .-> seoBase
  thamGiaPage -.-> tpl_thamGiaPage{{"thamGiaPage.cshtml"}}
  thiPage --> cuocThiLamBaiPage
  thiPage -. composition .-> seoBase
  thiPage -.-> tpl_thiPage{{"thiPage.cshtml"}}
  thiThangPage -. composition .-> seoBase
  thiThangPage -.-> tpl_thiThangPage{{"thiThangPage.cshtml"}}
  thiThuPage -. composition .-> seoBase
  thiThuPage -.-> tpl_thiThuPage{{"thiThuPage.cshtml"}}
  thuDoanPage -. composition .-> seoBase
  thuDoanPage -.-> tpl_thuDoanPage{{"thuDoanPage.cshtml"}}
  ungPhoPage -. composition .-> seoBase
  ungPhoPage -.-> tpl_ungPhoPage{{"ungPhoPage.cshtml"}}
```

## 3. Element type (block dùng trong trang)

Tổng 72 element type.

| Nhóm | Số | Element type |
|---|---|---|
| competition | 11 | competitionAuthenticityBlock, competitionFeedbackBlock, competitionHeroBlock, competitionOverviewBlock, competitionParticipationBlock, competitionPrizeItemBlock, competitionPrizesBlock, competitionPromoBlock, competitionReminderBlock, competitionResultsBlock, competitionScheduleBlock |
| contest | 10 | contestEntryResultBlock, contestExamFlowBlock, contestExamHeroBlock, contestQuestionBlock, contestRegistrationBlock, contestSidebarBlock, contestSubmissionBlock, contestTopicIntroBlock, contestTopicResultBlock, contestTopicsBlock |
| emergency | 10 | emergencyAnswerBlock, emergencyContactItemBlock, emergencyContactsBlock, emergencyHeroBlock, emergencyNumberItem, emergencyQuestionBlock, emergencyQuestionnaireBlock, emergencyScenarioBlock, emergencySituationGroupBlock, emergencySituationSelectorBlock |
| fraud | 6 | fraudAlertsBlock, fraudCategoriesBlock, fraudHeroBlock, fraudMethodItemBlock, fraudMethodsBlock, fraudObjectivesBlock |
| qa | 5 | qaGuidelinesBlock, qaHeroBlock, qaProcessBlock, qaPublishedAnswersBlock, qaSubmissionBlock |
| website | 4 | websiteCheckBlock, websiteHotspotBlock, websiteQuizBlock, websiteQuizOptionBlock |
| practice | 3 | practiceAnswerBlock, practiceQuestionBlock, practiceQuizBlock |
| site | 3 | siteNavigationItem, sitePolicyLinkItem, siteSectionsBlock |
| faq | 2 | faqBlock, faqItemBlock |
| intro | 2 | introHeroBlock, introStoryBlock |
| warning | 2 | warningSignItemBlock, warningSignsBlock |
| article | 1 | articleInformationItem |
| information | 1 | informationItemBlock |
| monthly | 1 | monthlyCompetitionHeroBlock |
| navigation | 1 | navigationItemBlock |
| next | 1 | nextSectionBlock |
| official | 1 | officialContactsBlock |
| one | 1 | oneColumnLayoutBlock |
| reading | 1 | readingCollectionsBlock |
| safety | 1 | safetyReminderBlock |
| section | 1 | sectionSettingsBlock |
| self | 1 | selfVerificationBlock |
| share | 1 | shareWebsiteBlock |
| story | 1 | storyChapterBlock |
| two | 1 | twoColumnLayoutBlock |

## 4. Cây nội dung mẫu (67 node)

```mermaid
graph LR
  nc02d1e18_b173_4e6c_88f6_e98ced94dc1e["Bài mẫu test123<br/><i>article</i>"]
  n068471f0_605e_57ee_b164_547aee46bc79["An toàn tài chính<br/><i>antc</i>"]
  n437e3947_4f08_52e1_baee_75907a540fac["Quản lý trang<br/><i>pageManagement</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd["Trang chủ<br/><i>home</i>"]
  n56e74727_59ec_4225_b2ce_ce853ad893ca["Ứng phó khẩn cấp<br/><i>ungPhoPage</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> n56e74727_59ec_4225_b2ce_ce853ad893ca
  n9ba61825_fa98_4e40_b442_772096d614f8["Thủ đoạn<br/><i>thuDoanPage</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> n9ba61825_fa98_4e40_b442_772096d614f8
  nb94dab90_8dee_4ff4_b934_c1fb7f723c61["Tham gia<br/><i>thamGiaPage</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> nb94dab90_8dee_4ff4_b934_c1fb7f723c61
  n6661be33_d417_4400_8828_952da9908c86["Thử sức: 8 câu<br/><i>thiThuPage</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> n6661be33_d417_4400_8828_952da9908c86
  n88abf9ef_fb93_45c5_9cff_4aa76ca6f250["Cuộc thi trực tuyến<br/><i>thiPage</i>"]
  n2418b19a_2e02_4083_aaea_2bc477167ff4["Làm bài<br/><i>cuocThiLamBaiPage</i>"]
  n88abf9ef_fb93_45c5_9cff_4aa76ca6f250 --> n2418b19a_2e02_4083_aaea_2bc477167ff4
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> n88abf9ef_fb93_45c5_9cff_4aa76ca6f250
  nb3ce7bf1_aa24_4acf_9bfd_8cd02d8f784e["Hỏi – Đáp<br/><i>hoiDapPage</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> nb3ce7bf1_aa24_4acf_9bfd_8cd02d8f784e
  n56fa7c6b_f4e1_44be_8200_ec8be7404349["Tìm kiếm<br/><i>searchPage</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> n56fa7c6b_f4e1_44be_8200_ec8be7404349
  ndc0bff3b_10be_53d5_87dc_d23ea675fd94["Chính sách<br/><i>chinhSachPage</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> ndc0bff3b_10be_53d5_87dc_d23ea675fd94
  n3ef975f7_186f_5a25_9e0a_dfe100d471d8["Cuộc thi tháng<br/><i>thiThangPage</i>"]
  nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd --> n3ef975f7_186f_5a25_9e0a_dfe100d471d8
  n437e3947_4f08_52e1_baee_75907a540fac --> nd660b5ab_7cd1_48b5_b6e1_1ab56b8218cd
  n068471f0_605e_57ee_b164_547aee46bc79 --> n437e3947_4f08_52e1_baee_75907a540fac
  n5a1e0af5_bbf2_54ed_a359_bc4716736ea5["Quản lý nội dung<br/><i>contentManagement</i>"]
  n33df5aae_5658_5ea1_8b01_500630acfd60["Thủ đoạn<br/><i>articleManagement</i>"]
  nf9386cdc_74f6_4893_acc8_eba3162cc7c0["Cuộc gọi, tin nhắn, giả mạo<br/><i>articleList</i>"]
  n90ab7780_e72b_4d53_ae5a_147dfb353e03["Bài mẫu: Cuộc gọi, tin nhắn, giả mạo<br/><i>article</i>"]
  nf9386cdc_74f6_4893_acc8_eba3162cc7c0 --> n90ab7780_e72b_4d53_ae5a_147dfb353e03
  n06451cc2_39c5_56cb_8c28_329ee3795768["Cuộc gọi báo tài khoản gặp sự cố: đừng vội đọc mã OTP<br/><i>article</i>"]
  nf9386cdc_74f6_4893_acc8_eba3162cc7c0 --> n06451cc2_39c5_56cb_8c28_329ee3795768
  n93bd0a2a_c311_54cd_bfa9_02ffecb90594["Cuộc gọi video tự xưng Công an: dừng lại trước yêu cầu chuyển tiền<br/><i>article</i>"]
  nf9386cdc_74f6_4893_acc8_eba3162cc7c0 --> n93bd0a2a_c311_54cd_bfa9_02ffecb90594
  n58b40473_ff1c_523c_990d_5a60737e74db["Video giống người thân nhờ chuyển tiền: xác minh thêm trước khi giúp<br/><i>article</i>"]
  nf9386cdc_74f6_4893_acc8_eba3162cc7c0 --> n58b40473_ff1c_523c_990d_5a60737e74db
  n00369843_d423_5608_93f8_188c004a7391["Tin nhắn báo phạt nguội kèm link: đừng thanh toán trong vội vàng<br/><i>article</i>"]
  nf9386cdc_74f6_4893_acc8_eba3162cc7c0 --> n00369843_d423_5608_93f8_188c004a7391
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> nf9386cdc_74f6_4893_acc8_eba3162cc7c0
  nfd38232c_0847_4379_9ccb_aba5ee852401["Mua bán, đặt cọc<br/><i>articleList</i>"]
  nd8e9bb9f_9494_4ec1_bfb1_8b862a2ddf84["Bài mẫu: Mua bán, đặt cọc<br/><i>article</i>"]
  nfd38232c_0847_4379_9ccb_aba5ee852401 --> nd8e9bb9f_9494_4ec1_bfb1_8b862a2ddf84
  naae99319_3ddd_5715_8ad7_ab98f0770b8c["Mua hàng online: kiểm tra trước khi đặt cọc hoặc nhận hoàn tiền<br/><i>article</i>"]
  nfd38232c_0847_4379_9ccb_aba5ee852401 --> naae99319_3ddd_5715_8ad7_ab98f0770b8c
  n96b33d9f_81f9_530a_a665_b6ac9fa648fb["Đặt phòng qua mạng: kiểm tra nơi nhận tiền trước khi đặt cọc<br/><i>article</i>"]
  nfd38232c_0847_4379_9ccb_aba5ee852401 --> n96b33d9f_81f9_530a_a665_b6ac9fa648fb
  n57400092_c253_5156_91ab_6e7b6ddbaf26["Shipper báo chuyển nhầm tiền: đừng nộp thêm để được hoàn đơn<br/><i>article</i>"]
  nfd38232c_0847_4379_9ccb_aba5ee852401 --> n57400092_c253_5156_91ab_6e7b6ddbaf26
  nb917d043_7ede_594b_9d44_c1a9ee6645be["Mua đồ cũ giá rẻ: đừng để lời hứa giữ hàng kéo bạn vào bẫy đặt cọc<br/><i>article</i>"]
  nfd38232c_0847_4379_9ccb_aba5ee852401 --> nb917d043_7ede_594b_9d44_c1a9ee6645be
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> nfd38232c_0847_4379_9ccb_aba5ee852401
  n9404a4c7_3fa8_4791_9c9e_dd677f5f3d49["Việc làm, làm thêm<br/><i>articleList</i>"]
  nadbb6788_1e56_411e_a493_aa42e457fc63["Bài mẫu: Việc làm, làm thêm<br/><i>article</i>"]
  n9404a4c7_3fa8_4791_9c9e_dd677f5f3d49 --> nadbb6788_1e56_411e_a493_aa42e457fc63
  n90ec1803_f525_5b8b_afb6_1958f72f7f55["Việc làm online yêu cầu nạp tiền: nhận diện bẫy nhiệm vụ<br/><i>article</i>"]
  n9404a4c7_3fa8_4791_9c9e_dd677f5f3d49 --> n90ec1803_f525_5b8b_afb6_1958f72f7f55
  nc5517b54_2c0d_5c83_9d5a_7015801a2984["Nhà tuyển dụng yêu cầu phí giữ chỗ: kiểm tra trước khi chuyển tiền<br/><i>article</i>"]
  n9404a4c7_3fa8_4791_9c9e_dd677f5f3d49 --> nc5517b54_2c0d_5c83_9d5a_7015801a2984
  n621ec217_8391_5d3a_a0b7_67b4c099285e["Việc đánh máy tại nhà đòi nạp tiền: phân biệt công việc với nhiệm vụ thu phí<br/><i>article</i>"]
  n9404a4c7_3fa8_4791_9c9e_dd677f5f3d49 --> n621ec217_8391_5d3a_a0b7_67b4c099285e
  nf84f67cc_31f4_5fec_9acc_64b0d3303d3f["Việc nhẹ lương cao ở nước ngoài: kiểm tra trước khi giao giấy tờ và lên đường<br/><i>article</i>"]
  n9404a4c7_3fa8_4791_9c9e_dd677f5f3d49 --> nf84f67cc_31f4_5fec_9acc_64b0d3303d3f
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> n9404a4c7_3fa8_4791_9c9e_dd677f5f3d49
  n928d8fe6_a83a_425c_a71e_419e28d0d3c3["Đầu tư, góp vốn<br/><i>articleList</i>"]
  nba05466b_4f4e_4a74_9d1c_db6d35b27cf3["Bài mẫu: Đầu tư, góp vốn<br/><i>article</i>"]
  n928d8fe6_a83a_425c_a71e_419e28d0d3c3 --> nba05466b_4f4e_4a74_9d1c_db6d35b27cf3
  n9a6b23e4_ca07_5d28_80f6_89d85d05035d["Đầu tư qua nhóm chat: lợi nhuận trên màn hình chưa phải tiền của bạn<br/><i>article</i>"]
  n928d8fe6_a83a_425c_a71e_419e28d0d3c3 --> n9a6b23e4_ca07_5d28_80f6_89d85d05035d
  n0640d792_3578_5f82_a6ed_213b627fa91f["Ứng dụng đầu tư do chuyên gia gửi: kiểm tra đơn vị đứng sau màn hình<br/><i>article</i>"]
  n928d8fe6_a83a_425c_a71e_419e28d0d3c3 --> n0640d792_3578_5f82_a6ed_213b627fa91f
  n9944d64d_2e79_5465_9ab8_faf70e23ea24["Rút lợi nhuận lại bị đòi nộp thuế, phí: đừng chuyển tiền theo thông báo trong nhóm<br/><i>article</i>"]
  n928d8fe6_a83a_425c_a71e_419e28d0d3c3 --> n9944d64d_2e79_5465_9ab8_faf70e23ea24
  nce8fe46d_4895_5e4f_beed_ad9dc5fe92cc["Góp vốn nhận lãi đều: hỏi tiền trả lãi đến từ hoạt động nào<br/><i>article</i>"]
  n928d8fe6_a83a_425c_a71e_419e28d0d3c3 --> nce8fe46d_4895_5e4f_beed_ad9dc5fe92cc
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> n928d8fe6_a83a_425c_a71e_419e28d0d3c3
  n0400f699_d1d5_4ad1_8b76_91722ba48a77["Vay, nợ<br/><i>articleList</i>"]
  n1c05cd5b_9cb3_42ab_8992_18308d3e0332["Bài mẫu: Vay, nợ<br/><i>article</i>"]
  n0400f699_d1d5_4ad1_8b76_91722ba48a77 --> n1c05cd5b_9cb3_42ab_8992_18308d3e0332
  n7bcb3b89_2799_5fee_b814_141615ff32e0["Vay online phải chuyển phí trước: dừng lại để xác minh<br/><i>article</i>"]
  n0400f699_d1d5_4ad1_8b76_91722ba48a77 --> n7bcb3b89_2799_5fee_b814_141615ff32e0
  n33ce6e02_927c_5849_b985_9a1b3094ed42["Ứng dụng vay xin quyền danh bạ: đọc kỹ trước khi đồng ý<br/><i>article</i>"]
  n0400f699_d1d5_4ad1_8b76_91722ba48a77 --> n33ce6e02_927c_5849_b985_9a1b3094ed42
  n975b49e1_a6db_5169_bc2d_4b510b090aba["Nhân viên báo đổi tài khoản thu nợ: xác minh trước khi thanh toán<br/><i>article</i>"]
  n0400f699_d1d5_4ad1_8b76_91722ba48a77 --> n975b49e1_a6db_5169_bc2d_4b510b090aba
  n5df38bc5_9ce8_5a50_b9cc_2269e9ac131a["Tài khoản nhận tiền lạ rồi bị đòi nợ: xử lý qua ngân hàng<br/><i>article</i>"]
  n0400f699_d1d5_4ad1_8b76_91722ba48a77 --> n5df38bc5_9ce8_5a50_b9cc_2269e9ac131a
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> n0400f699_d1d5_4ad1_8b76_91722ba48a77
  ncbcea9dd_b92a_4d94_9d43_0487077fe916["Hợp đồng, dịch vụ<br/><i>articleList</i>"]
  naf76aeed_93a0_4872_8d27_8f8a4ee64657["Bài mẫu: Hợp đồng, dịch vụ<br/><i>article</i>"]
  ncbcea9dd_b92a_4d94_9d43_0487077fe916 --> naf76aeed_93a0_4872_8d27_8f8a4ee64657
  n3f4d17ca_584f_573d_a4a6_ac1eb04d5d37["Hợp đồng kỳ nghỉ: kiểm tra gì trước khi ký và đặt cọc?<br/><i>article</i>"]
  ncbcea9dd_b92a_4d94_9d43_0487077fe916 --> n3f4d17ca_584f_573d_a4a6_ac1eb04d5d37
  nc1e925df_0616_5796_85d0_51a4bbf0edb2["Dịch vụ hứa lấy lại tiền bị lừa: cảnh giác mất tiền lần hai<br/><i>article</i>"]
  ncbcea9dd_b92a_4d94_9d43_0487077fe916 --> nc1e925df_0616_5796_85d0_51a4bbf0edb2
  nd9ba1e27_9d68_5ab5_b2d8_911be2d53e06["Dịch vụ visa hứa bao đậu: đọc rõ phạm vi công việc trước khi trả phí<br/><i>article</i>"]
  ncbcea9dd_b92a_4d94_9d43_0487077fe916 --> nd9ba1e27_9d68_5ab5_b2d8_911be2d53e06
  n011d01f8_cc0e_52a5_8e56_b4ee6e2cbbbc["Hợp đồng dịch vụ: đừng ký khi phí và điều kiện hoàn tiền còn bỏ trống<br/><i>article</i>"]
  ncbcea9dd_b92a_4d94_9d43_0487077fe916 --> n011d01f8_cc0e_52a5_8e56_b4ee6e2cbbbc
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> ncbcea9dd_b92a_4d94_9d43_0487077fe916
  ncda7084d_12ac_4edf_bbd9_94b53d78cecc["Cảnh báo<br/><i>articleList</i>"]
  n3efa48cc_59f6_4dcf_afc8_ac76442f4135["Ứng dụng giả mạo dịch vụ công dụ người dân cài đặt<br/><i>article</i>"]
  ncda7084d_12ac_4edf_bbd9_94b53d78cecc --> n3efa48cc_59f6_4dcf_afc8_ac76442f4135
  nc2d699ab_57b1_4ded_b55e_5a02c178a556["Mời góp vốn qua ứng dụng cam kết lợi nhuận cố định<br/><i>article</i>"]
  ncda7084d_12ac_4edf_bbd9_94b53d78cecc --> nc2d699ab_57b1_4ded_b55e_5a02c178a556
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> ncda7084d_12ac_4edf_bbd9_94b53d78cecc
  ne2aa83a7_8e13_436b_9569_8de11c44ce4d["Bài đọc theo chuyên đề<br/><i>articleList</i>"]
  n4a808713_bc6e_536c_84cf_a92fcbaa71e0["Chuyên đề: Dừng lại khi bị thúc ép chuyển tiền<br/><i>article</i>"]
  ne2aa83a7_8e13_436b_9569_8de11c44ce4d --> n4a808713_bc6e_536c_84cf_a92fcbaa71e0
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> ne2aa83a7_8e13_436b_9569_8de11c44ce4d
  n3ca68856_dc5b_4335_af7d_42addb4e4db6["Lừa đảo: Từ cổ chí kim<br/><i>articleList</i>"]
  nca384def_c79b_50ca_aef1_f7d53736f3fb["Từ cổ chí kim: Từ mô hình Ponzi đến ứng dụng đầu tư giả mạo<br/><i>article</i>"]
  n3ca68856_dc5b_4335_af7d_42addb4e4db6 --> nca384def_c79b_50ca_aef1_f7d53736f3fb
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> n3ca68856_dc5b_4335_af7d_42addb4e4db6
  nb514b99f_0e40_570d_bf72_f5b9c98f3b20["Nội dung giới thiệu<br/><i>fraudContent</i>"]
  n33df5aae_5658_5ea1_8b01_500630acfd60 --> nb514b99f_0e40_570d_bf72_f5b9c98f3b20
  n5a1e0af5_bbf2_54ed_a359_bc4716736ea5 --> n33df5aae_5658_5ea1_8b01_500630acfd60
  n2de3a8b9_e4b6_4348_9321_9b979aa1f398["Chính sách<br/><i>articleList</i>"]
  n0193cd20_026f_4a33_8f04_b5bf5fc3c0fc["Tuyên bố miễn trừ trách nhiệm<br/><i>article</i>"]
  n2de3a8b9_e4b6_4348_9321_9b979aa1f398 --> n0193cd20_026f_4a33_8f04_b5bf5fc3c0fc
  n66d90202_dc1e_4396_bed0_4d7c02305283["Chính sách bảo vệ dữ liệu cá nhân<br/><i>article</i>"]
  n2de3a8b9_e4b6_4348_9321_9b979aa1f398 --> n66d90202_dc1e_4396_bed0_4d7c02305283
  n6eed8736_db48_4151_bb71_0fac9635d1aa["Chính sách tài trợ<br/><i>article</i>"]
  n2de3a8b9_e4b6_4348_9321_9b979aa1f398 --> n6eed8736_db48_4151_bb71_0fac9635d1aa
  n1767e333_7dc2_486a_a48b_23b1cbdc86ac["Nguyên tắc dẫn nguồn<br/><i>article</i>"]
  n2de3a8b9_e4b6_4348_9321_9b979aa1f398 --> n1767e333_7dc2_486a_a48b_23b1cbdc86ac
  n7a2fe7ec_f999_46e2_9029_db9943057404["Cách báo lỗi và cải chính<br/><i>article</i>"]
  n2de3a8b9_e4b6_4348_9321_9b979aa1f398 --> n7a2fe7ec_f999_46e2_9029_db9943057404
  n5a1e0af5_bbf2_54ed_a359_bc4716736ea5 --> n2de3a8b9_e4b6_4348_9321_9b979aa1f398
  n2c005e78_f6d3_5403_9cdf_0ac15562d9c0["Nội dung giới thiệu Chính sách<br/><i>policyContent</i>"]
  n5a1e0af5_bbf2_54ed_a359_bc4716736ea5 --> n2c005e78_f6d3_5403_9cdf_0ac15562d9c0
  n068471f0_605e_57ee_b164_547aee46bc79 --> n5a1e0af5_bbf2_54ed_a359_bc4716736ea5
```

## 5. Mã C# tuỳ biến

### Umbraco.Plugin.Custom.Core

| Thư mục | Số file | File |
|---|---|---|
| Administration | 9 | AdministrationAccess, ContestAuditService, ContestCsv, ContestPrivacyModels, ContestPrivacyService, ContestReportCsvRows, ContestReportModels, ContestReportingService, SqlitePrivacyFileCleanup |
| Articles | 10 | ArticleContentSource, ArticleHtmlSanitizer, ArticleModels, ArticlePageContent, ArticlePageContentSource, ArticleQuery, ArticleReviewPolicy, ArticleSchemaMigration, ArticleSearchText, PublishedArticleService |
| Backoffice | 1 | ContestManagementSectionAccessHandler |
| Composers | 1 | CustomCoreComposer |
| Content | 4 | AntcPublicPaths, AntcPublicRouting, PageTreeNotifications, PageTreeRules |
| Contest | 14 | ContestAdminModels, ContestAdminService.Draws, ContestAdminService, ContestAttemptService, ContestCatalog, ContestConfigCheck, ContestEntryService, ContestModels, ContestPromotionService, ContestResultsModels, ContestResultsService, ContestScheduleService, CryptographicLottery, CurrentContestService |
| Data | 7 | AppDbContext, AppDbInitializer, ContestAccessAudit, ContestPublishedResult, Entities, PrivacyOperation, SqliteDeploymentBackup |
| Questions | 7 | QuestionCsv, QuestionGuidanceLink, QuestionModels, QuestionModerationService, QuestionOperations, QuestionRetentionService, QuestionSubmissionService |
| Quiz | 5 | QuestionBank, QuizAdminModels, QuizAdminService, QuizWorkbookModels, QuizWorkbookService |
| Services | 1 | AppInfoService |

### Umbraco.Plugin.Custom.Api

| Thư mục | Số file | File |
|---|---|---|
| Composers | 1 | CustomApiComposer |
| Controllers | 19 | ContestAdminController, ContestController, ContestDrawsController, ContestPrivacyController, ContestReportingController, ContestResultsController, ContestsController, LegacyContestReportingController, LegacyQuestionsAdministrationController, PublishedArticleContentController, PublishedArticlesController, PublishedQuestionsController, QuestionManagementController, QuestionOperationsController, QuestionsController, QuizAdminController, QuizController, QuizWorkbookController, SystemController |
| Infrastructure | 7 | AdministrationIpAllowlistMiddleware, ApiBoundaryMiddleware, ApiPrivacyLogFilter, ApiProtection, ContestAdministrationAuthorizationResult, DatabaseReadiness, DeploymentTrafficGateMiddleware |
| Models | 3 | ApiErrorModels, ContestScheduleModels, QuestionModels |
| Validation | 1 | QuestionRequestValidator |

### Umbraco.Plugin.Custom.Tests

| Thư mục | Số file | File |
|---|---|---|
| (gốc) | 27 | AntcPublicPathsTests, ApiProtectionTests, ContestAdministrationFullHostTests, ContestAdministrationPrivacyTests, ContestAttemptServiceTests, ContestBackofficeAssetsTests, ContestCampaignAdminServiceTests, ContestCatalogTests, ContestDrawAdminServiceTests, ContestEntryServiceTests, ContestPrivacyTests, ContestPromotionServiceTests, ContestReportingTests, ContestResultsTests, ContestScheduleServiceTests, ContestsControllerTests, CurrentContestServiceTests, DatabaseReadinessTests, DeploymentSafetyTests, QuestionBankTests, QuestionGuidanceTests, QuestionsControllerTests, QuizAdminServiceTests, QuizControllerTests, QuizWorkbookTests, SubmissionResultMigrationTests, Usings |


### API routes

| Controller | Route |
|---|---|
| ContestAdminController | GET api/v1/admin/contest/campaigns, GET api/v1/admin/contest/campaigns/question-tree, GET api/v1/admin/contest/campaigns/{id:long}, POST api/v1/admin/contest/campaigns, PUT api/v1/admin/contest/campaigns/{id:long}, DELETE api/v1/admin/contest/campaigns/{id:long}, GET api/v1/admin/contest/entries, GET api/v1/admin/contest/entries/{id:long}, GET api/v1/admin/contest/draws, GET api/v1/admin/contest/draws/{id:long}, POST api/v1/admin/contest/draws, PUT api/v1/admin/contest/draws/{id:long}, DELETE api/v1/admin/contest/draws/{id:long} |
| ContestController | POST api/v1/contest/entries, GET api/v1/contest/entries/me, POST api/v1/contest/entries/me/answers, PUT api/v1/contest/entries/me/contact, POST api/v1/contest/entries/me/submit |
| ContestDrawsController | GET /options, GET , GET /{id:long}, POST /preview, POST , GET /{id:long}/export/{kind} |
| ContestPrivacyController | POST /preview, POST /erase, POST /bulk, GET /operations, POST /operations/{id:guid}/vacuum |
| ContestReportingController | GET /options, GET /dashboard, GET /entries, GET /entries/{id:long}, GET /questions, GET /export/{kind}, GET /contests/{id:long}/publication, PUT /contests/{id:long}/publication, GET /contests/{id:long}/draws |
| ContestResultsController | GET api/v1/contests/{contestId:long}/results, GET api/v1/contests/{contestId:long}/results/antiforgery, GET api/v1/contests/{contestId:long}/results, PUT api/v1/contests/{contestId:long}/results |
| ContestsController | GET api/v1/contests |
| LegacyContestReportingController | GET //quan-tri, GET //quan-tri/cuoc-thi, GET //quan-tri/luot-thi, GET //quan-tri/luot-thi/{id:long}, GET //quan-tri/thong-ke-cau-hoi |
| LegacyQuestionsAdministrationController | GET //quan-tri/hoi-dap |
| PublishedArticleContentController | GET api/v1/article-content/fraud, GET api/v1/article-content/policy |
| PublishedArticlesController | GET api/v1/article-categories, GET api/v1/article-categories/{id:guid}, GET api/v1/article-categories/by-path, GET api/v1/articles, GET api/v1/articles/{id:guid}, GET api/v1/articles/by-path |
| PublishedQuestionsController | GET api/v1/questions, GET api/v1/questions/{id:long} |
| QuestionManagementController | POST , GET , GET /{id:long}, PUT /{id:long}, POST /{id:long}/approve, POST /{id:long}/unpublish, GET /export |
| QuestionOperationsController | POST /aggregate, DELETE /{id:long}, POST /bulk-delete, GET /retention, PUT /retention, POST /retention/run |
| QuestionsController | POST api/v1/questions |
| QuizAdminController | GET api/v1/admin/quiz/topics, GET api/v1/admin/quiz/topics/{id:int}, POST api/v1/admin/quiz/topics, PUT api/v1/admin/quiz/topics/{id:int}, DELETE api/v1/admin/quiz/topics/{id:int}, GET api/v1/admin/quiz/questions, GET api/v1/admin/quiz/questions/{code}, POST api/v1/admin/quiz/questions, PUT api/v1/admin/quiz/questions/{code}, DELETE api/v1/admin/quiz/questions/{code} |
| QuizController | GET api/v1/quiz/topics, GET api/v1/quiz/topics/{topic:int}/questions, GET api/v1/quiz/sample |
| QuizWorkbookController | GET api/v1/admin/quiz/imports/template, GET api/v1/admin/quiz/imports/export, POST api/v1/admin/quiz/imports/preview, POST api/v1/admin/quiz/imports/confirm, GET api/v1/admin/quiz/imports, GET api/v1/admin/quiz/imports/{id:long}/file |
| SystemController | GET api/v1/system/info |
