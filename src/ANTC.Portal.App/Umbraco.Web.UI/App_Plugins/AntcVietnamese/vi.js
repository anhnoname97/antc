// Bổ sung bộ dịch Umbraco 18.2.1 tại tầng App; giữ nguyên mã định danh và tham số động.
export default {
    uSyncHistory: { clear: 'Xóa lịch sử', clearWarning: 'Thao tác này sẽ xóa toàn bộ lịch sử đồng bộ uSync.', empty: 'Chưa có lần đồng bộ nào', disabled: 'Lịch sử đồng bộ đã bị tắt' },
    uSync: {
        section: 'Đồng bộ dữ liệu', name: 'uSync', banner: 'Đồng bộ cấu hình và nội dung', migrate: 'Chuyển đổi dữ liệu',
        defaultView: 'Tổng quan', settingsView: 'Cài đặt', addons: 'Tiện ích bổ sung', groupEverything: 'Tất cả', groupContent: 'Nội dung',
        groupSettings: 'Cài đặt', groupForms: 'Biểu mẫu', groupMedia: 'Phương tiện', groupMembers: 'Thành viên',
        Report: 'Kiểm tra thay đổi', Import: 'Nhập dữ liệu', Export: 'Xuất dữ liệu', ImportForce: 'Nhập bắt buộc', ExportClean: 'Xuất và dọn dữ liệu cũ',
        ExportFile: 'Xuất ra tệp', ImportFile: 'Nhập từ tệp', noChange: 'Không có thay đổi', showAll: 'Hiện tất cả mục',
        detailHeadline: 'Thay đổi được phát hiện', detailHeader: 'Các điểm khác biệt',
        runningInBackground: 'Tiến trình đồng bộ đang chạy nền và sẽ tiếp tục khi bạn rời trang này.',
        connectionLost: 'Đã mất kết nối máy chủ. Tiến trình vẫn chạy nền nhưng không thể hiển thị cập nhật tại đây.',
        importSingle: 'Nhập dữ liệu', importSingleWarning: 'Nhập mục này vào Umbraco. Các mục phụ thuộc sẽ không được nhập và cần được xử lý riêng.',
        importSingleSuccess: 'Đã nhập mục thành công', importSingleFailed: '<p>Không thể nhập mục</p><strong>%0%</strong>',
        changeAction: 'Thao tác', changeItem: 'Mục', changeDiffrence: 'Khác biệt', changeProperty: 'Thuộc tính', changeRawXml: 'XML gốc',
        changeError: 'Lỗi', changeWarning: 'Cảnh báo', diffOneChange: '1 thay đổi', diffChangeCount: '{0} thay đổi',
        diffChangeCapped: '{0} trên {1} thay đổi', diffMoreChanges: 'Thêm {0} thay đổi', diffMoreChangesAtLeast: 'Thêm ít nhất {0} thay đổi',
        diffLineCount: 'Thêm {0} / xóa {1} dòng', diffShowUnchanged: 'Hiện {0} dòng không thay đổi', diffHideUnchanged: 'Ẩn dòng không thay đổi',
        diffValueChanged: 'Đã đổi giá trị', diffValueAdded: 'Đã thêm giá trị', diffValueRemoved: 'Đã xóa giá trị', diffReordered: 'Đã đổi thứ tự',
        diffMaskedShort: 'Giá trị bị ẩn', diffMasked: 'Giá trị này bị ẩn và không thể so sánh', diffTooLargeShort: 'Quá lớn để so sánh',
        diffTooLarge: 'Giá trị quá lớn để so sánh. Hiển thị giá trị gốc.', diffDegraded: 'Dữ liệu so sánh quá lớn nên kết quả đã được rút gọn.',
        diffAdded: 'Đã thêm', diffRemoved: 'Đã xóa', diffChanged: 'Đã thay đổi', diffOldValue: 'Giá trị cũ', diffNewValue: 'Giá trị mới',
        diffShowRaw: 'Hiện giá trị gốc', diffHideRaw: 'Ẩn giá trị gốc', diffPath: 'Đường dẫn: {0}', diffCopyPath: 'Sao chép đường dẫn',
        diffExpandedNote: 'Giá trị chứa dữ liệu JSON đã mã hóa và được mở rộng để hiển thị.',
        changeCreate: 'Mục chưa có trong Umbraco và sẽ được tạo mới', noChangesImport: 'Mục này không có thay đổi',
        noChangesReport: 'Không phát hiện thay đổi', noChangesDelete: 'Mục đã bị xóa khỏi Umbraco', importHeader: 'Nhập từ tệp',
        success: 'Thành công', change: 'Thay đổi', changeType: 'Loại', changeName: 'Tên', changeDetail: 'Chi tiết', changeHeading: 'Kết quả',
        changeCount: '{1}/{0} thay đổi', noChangeCount: '0/{0} thay đổi',
        legacyInfo: '<p>Phát hiện thư mục uSync cũ tại <strong>%0%</strong>. Nội dung có thể cần chuyển đổi.</p>',
        legacyObsolete: '<h4>Loại dữ liệu đã lỗi thời</h4><ul>%0%</ul><p>Có thể chuyển đổi bằng <a href="https://github.com/Jumoo/uSyncMigrations" target="_blank" rel="noopener">uSync.Migrations</a>.</p>',
        legacyCopy: '<h4>Sao chép vào uSync/v14</h4><p>Có thể sao chép thư mục %0% vào ~/uSync/v14 rồi chạy nhập dữ liệu. Nếu không cần chuyển đổi, tất cả mục sẽ được nhập.</p><p>Đổi tên hoặc xóa thư mục %0% để ngừng thông báo này.</p>',
        hmacMismatch: '<h4>Mã HMAC không khớp</h4><p>Cấu hình <code>Imaging:HMAC</code> hiện tại khác với cấu hình tạo tệp uSync. Ảnh trong trình soạn thảo có thể không hiển thị đúng. Bật ánh xạ HMAC trong uSync hoặc sử dụng giá trị HMAC khớp với tệp nguồn.</p>',
        formatMismatch: 'Phiên bản định dạng tệp đồng bộ không khớp với phiên bản yêu cầu. Có thể có vấn đề tương thích.',
        legacyBanner: 'Trang web có tệp từ phiên bản uSync cũ. Xem chi tiết tại thẻ Chuyển đổi dữ liệu.',
        legacyCopyTitle: 'Ghi đè tệp phiên bản %0%', legacyCopyContent: 'Bạn có chắc chắn muốn ghi đè thư mục %0% bằng các tệp uSync cũ?',
        legacyIgnoreTitle: 'Bỏ qua tệp cũ', legacyIgnoreContent: 'Bạn có chắc chắn muốn bỏ qua các tệp trong thư mục uSync cũ?',
        errorHeader: 'Có lỗi khi xử lý mục này. Chi tiết bên dưới:', uploadIntro: 'Chọn tệp ZIP chứa các tệp uSync cần tải lên',
        uploadSuccess: 'Đã tải lên và giải nén tệp vào thư mục uSync', uploadError: 'Không thể tải lên tệp',
        ILanguage: 'Ngôn ngữ', IDictionaryItem: 'Mục từ điển', IDataType: 'Loại dữ liệu', ITemplate: 'Mẫu giao diện',
        IContentType: 'Loại nội dung', IMediaType: 'Loại phương tiện', IMemberType: 'Loại thành viên', IElement: 'Thư viện',
        IContent: 'Nội dung', IMedia: 'Phương tiện', IDomain: 'Tên miền', IWebhook: 'Thông báo qua webhook', IRelationType: 'Loại quan hệ',
        MediaFile: 'Tệp phương tiện', XElement: 'Khác', LanguageHandler: 'Ngôn ngữ', DictionaryHandler: 'Mục từ điển',
        DataTypeHandler: 'Loại dữ liệu', TemplateHandler: 'Mẫu giao diện', ContentTypeHandler: 'Loại nội dung', MediaTypeHandler: 'Loại phương tiện',
        MemberTypeHandler: 'Loại thành viên', ContentHandler: 'Nội dung', MediaHandler: 'Phương tiện', RelationTypeHandler: 'Loại quan hệ',
        EntityContainer: 'Thư mục chứa'
    },
    USyncSettings: {
        settings: 'Cài đặt uSync', filesAndFolders: 'Tệp và thư mục', handlerDefaults: 'Cấu hình xử lý mặc định', processingMode: 'Chế độ xử lý',
        processingModeDesc: 'Chạy tiến trình uSync ở chế độ nền hoặc tương tác trực tiếp.', importAtStartup: 'Nhập dữ liệu khi khởi động',
        importAtStartupDesc: 'Nhập các tệp từ ổ đĩa khi Umbraco khởi động.', exportAtStartup: 'Xuất dữ liệu khi khởi động',
        exportAtStartupDesc: 'Xuất cấu hình Umbraco khi trang web khởi động.', exportOnSave: 'Xuất dữ liệu khi lưu',
        exportOnSaveDesc: 'Tạo tệp uSync khi lưu các mục.', uiEnabledGroups: 'Nhóm được phép dùng trên giao diện',
        uiEnabledGroupsDesc: 'Các nhóm xử lý có thể xem và sử dụng trên bảng điều khiển.', failOnMissingParent: 'Báo lỗi khi thiếu mục cha',
        failOnMissingParentDesc: 'Dừng xử lý nếu không tìm thấy mục cha.', currentHandlerSet: 'Bộ xử lý hiện tại', handlerSet: 'Bộ xử lý mặc định',
        handlerSetDesc: 'Bộ xử lý mặc định được dùng cho trang web.', flatStructure: 'Cấu trúc thư mục phẳng',
        flatStructureDesc: 'Các mục cùng loại được lưu trực tiếp trong một thư mục.', guidNames: 'Dùng mã GUID làm tên tệp',
        guidNamesDesc: 'Dùng mã định danh GUID của mục để đặt tên tệp.', handlerGroups: 'Nhóm xử lý', handlerGroupsDesc: 'Giới hạn bộ xử lý theo nhóm.',
        disabledHandlers: 'Bộ xử lý bị tắt', disabledHandlersDesc: 'Các bộ xử lý bị vô hiệu hóa trong bộ hiện tại.', folders: 'Thư mục',
        foldersDesc: 'Các thư mục uSync tìm kiếm tệp. Mục thường được lưu vào thư mục cuối danh sách.', rootSite: 'Trang web gốc',
        rootSiteDesc: 'Trang web này có làm nguồn cho các trang web khác không.', rootLocked: 'Khóa dữ liệu gốc',
        rootLockedDesc: 'Khóa thay đổi đối với các mục lấy từ trang web gốc.',
        help: 'Cài đặt được quản lý trong appsettings.json. Xem <a href="https://docs.jumoo.co.uk/usync/uSync/reference/config" target="_blank" rel="noopener">tài liệu hướng dẫn</a>.',
        bootSettings: 'Cài đặt khởi động lần đầu', firstBoot: 'Nhập dữ liệu khi khởi động lần đầu', firstBootDesc: 'Chạy nhập dữ liệu ở lần khởi động đầu tiên.',
        firstBootGroup: 'Nhóm nhập lần đầu', firstBootGroupDesc: 'Các nhóm được xử lý ở lần khởi động đầu tiên.'
    },
    assignDomain: { domainHelpWithVariants: 'Tên miền hợp lệ: "example.com", "www.example.com", "example.com:8080" hoặc "https://www.example.com/". Có thể dùng đường dẫn một cấp, ví dụ "example.com/en" hoặc "/en".' },
    actions: {
        clear: 'Xóa nội dung', copyInProgress: 'Đang sao chép, vui lòng chờ...',
        createFor: name => name ? `Tạo mục trong ${name}` : 'Tạo mới',
        deleteInProgress: 'Đang xóa, vui lòng chờ...', moveInProgress: 'Đang di chuyển, vui lòng chờ...',
        showMore: 'Xem thêm', auditTrail: 'Nhật ký thao tác', export: 'Xuất dữ liệu',
        exportDocumentType: 'Xuất loại tài liệu', import: 'Nhập dữ liệu',
        importdocumenttype: 'Nhập loại tài liệu', importPackage: 'Nhập gói mở rộng',
        liveEdit: 'Chỉnh sửa trực tiếp'
    },
    actionCategories: { general: 'Chung' },
    buttons: {
        openInSplitView: 'Mở trong chế độ chia đôi', openVersionSelector: 'Mở danh sách phiên bản',
        closeVersionSelector: 'Đóng danh sách phiên bản'
    },
    auditTrails: {
        contentversionpreventcleanup: 'Đã tắt dọn dẹp phiên bản: %0%',
        contentversionenablecleanup: 'Đã bật dọn dẹp phiên bản: %0%'
    },
    auditTrailsMedia: {
        delete: 'Đã xóa tệp phương tiện', move: 'Đã di chuyển tệp phương tiện',
        copy: 'Đã sao chép tệp phương tiện', save: 'Đã lưu tệp phương tiện'
    },
    auditTrailsElement: {
        delete: 'Đã xóa phần tử', unpublish: 'Đã hủy xuất bản phần tử',
        unpublishvariant: 'Đã hủy xuất bản phần tử cho các ngôn ngữ: %0%',
        publish: 'Đã lưu và xuất bản phần tử', publishvariant: 'Đã lưu và xuất bản phần tử cho các ngôn ngữ: %0%',
        save: 'Đã lưu phần tử', savevariant: 'Đã lưu phần tử cho các ngôn ngữ: %0%',
        move: 'Đã di chuyển phần tử', copy: 'Đã sao chép phần tử', rollback: 'Đã khôi phục phần tử',
        custom: '%0%', contentversionpreventcleanup: 'Đã tắt dọn dẹp phiên bản: %0%',
        contentversionenablecleanup: 'Đã bật dọn dẹp phiên bản: %0%'
    },
    collection: { cardViewLabel: 'Dạng thẻ', tableViewLabel: 'Dạng bảng' },
    content: {
        unpublishedChanges: 'Thay đổi chưa xuất bản', protected: 'Được bảo vệ',
        scheduledPublishing: 'Đã lên lịch xuất bản', trashed: 'Đã chuyển vào thùng rác',
        openSplitViewForVariant: variant => `Mở ${variant} trong chế độ chia đôi`,
        sharedAcrossCultures: 'Dùng chung giữa các ngôn ngữ', sharedAcrossSegments: 'Dùng chung giữa các phân đoạn',
        shared: 'Dùng chung', alternativeTextHelp: 'Mô tả nội dung ảnh cho người không nhìn thấy ảnh',
        createFromClipboard: 'Dán từ bộ nhớ tạm'
    },
    media: {
        disallowedFileExtension: extension => `Không thể tải tệp .${extension} vì không có loại phương tiện hỗ trợ định dạng này`,
        disallowedMediaTypeNotAllowedHere: (extension, mediaTypeName) => `Không thể tải tệp .${extension} tại đây vì loại phương tiện ${mediaTypeName} không được phép ở vị trí này`,
        disallowedMediaTypesNotAllowedHere: (extension, mediaTypeNames) => `Không thể tải tệp .${extension} tại đây vì các loại phương tiện (${mediaTypeNames}) không được phép ở vị trí này`
    },
    member: {
        memberKindExternalOnly: 'Bên ngoài', profileData: 'Thông tin hồ sơ', externalMemberTitle: 'Thành viên bên ngoài',
        externalMemberDescription: 'Thành viên này được quản lý bởi nhà cung cấp xác thực bên ngoài. Thông tin định danh như thư điện tử và tên đăng nhập do nhà cung cấp quản lý.'
    },
    create: {
        noElementTypes: 'Không có loại phần tử được phép tạo tại đây. Vào <strong>Cài đặt → Loại tài liệu</strong>, mở <strong>Cấu trúc</strong> và bật <strong>Cho phép trong thư viện</strong>.',
        element: 'Phần tử', elementDescription: 'Chọn loại phần tử cần tạo', composition: 'Thành phần dùng chung',
        noDocumentTypes: 'Không có loại tài liệu được phép tạo tại đây. Vào <strong>Cài đặt → Loại tài liệu</strong> và cấu hình các loại mục con được phép trong <strong>Cấu trúc</strong>.',
        noMediaTypes: 'Không có loại phương tiện được phép tạo tại đây. Vào <strong>Cài đặt → Loại phương tiện</strong> và cấu hình các loại mục con được phép trong <strong>Cấu trúc</strong>.'
    },
    defaultdialogs: {
        colorSwitcher: 'Chuyển màu', confirmRemoveItem: name => `Bạn có chắc chắn muốn xóa${name ? ` <strong>${name}</strong>` : ' mục này'}?`,
        noIcon: 'Không có biểu tượng', urlLinkPicker: 'Liên kết', anchorLinkPicker: 'Mã neo hoặc chuỗi truy vấn',
        stacktrace: 'Chi tiết ngăn xếp lỗi', innerException: 'Lỗi bên trong', selectMediaStartNode: 'Chọn mục gốc phương tiện'
    },
    general: {
        changeView: 'Đổi chế độ xem', description: 'Mô tả', dividerPosition: value => `Vạch chia tại ${value}%`,
        documentCount: count => `${count} tài liệu`, none: 'Không có', placeholder: 'Gợi ý nhập',
        propertyEditor: 'Trình biên tập thuộc tính', reset: 'Đặt lại', scrollLeft: 'Cuộn sang trái',
        scrollRight: 'Cuộn sang phải', weight: 'Độ ưu tiên', clipboard: 'Bộ nhớ tạm',
        alias: 'Bí danh', cellMargin: 'Lề ô', email: 'Thư điện tử', id: 'Mã định danh', innerMargin: 'Lề trong',
        pixels: 'điểm ảnh', manifest: 'Tệp khai báo', macro: 'Đoạn mã dùng chung'
    },
    colors: {
        black: 'Đen', brown: 'Nâu', cyan: 'Xanh lơ', green: 'Xanh lá', lightBlue: 'Xanh dương nhạt',
        pink: 'Hồng', red: 'Đỏ', text: 'Đen', yellow: 'Vàng', white: 'Trắng', grey: 'Xám'
    },
    globalSearch: { documents: 'Tài liệu' },
    login: {
        continue: 'Tiếp tục', validate: 'Xác minh', login: 'Đăng nhập', email: 'Thư điện tử', username: 'Tên đăng nhập',
        password: 'Mật khẩu', submit: 'Gửi', required: 'Bắt buộc', success: 'Thành công', forgottenPassword: 'Quên mật khẩu?',
        forgottenPasswordInstruction: 'Hệ thống sẽ gửi thư điện tử chứa liên kết đặt lại mật khẩu.',
        requestPasswordResetConfirmation: 'Nếu địa chỉ thư điện tử khớp với tài khoản đã đăng ký, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.',
        setPasswordInstruction: 'Vui lòng nhập mật khẩu mới.', setPasswordConfirmation: 'Đã cập nhật mật khẩu.',
        rememberMe: 'Ghi nhớ đăng nhập', error: 'Lỗi', defaultError: 'Đã xảy ra lỗi khi xử lý yêu cầu.',
        errorInPasswordFormat: 'Mật khẩu phải có ít nhất {0} ký tự, trong đó có ít nhất {1} ký tự đặc biệt.',
        passwordMismatch: 'Mật khẩu xác nhận không khớp với mật khẩu mới.', passwordMinLength: 'Mật khẩu phải có ít nhất {0} ký tự.',
        passwordIsBlank: 'Mật khẩu không được để trống.', userFailedLogin: 'Không thể đăng nhập. Vui lòng kiểm tra thông tin và thử lại.',
        userLockedOut: 'Tài khoản đã bị khóa. Vui lòng thử lại sau.', receivedErrorFromServer: 'Máy chủ trả về lỗi',
        resetCodeExpired: 'Liên kết không hợp lệ hoặc đã hết hạn.',
        userInviteWelcomeMessage: 'Chào mừng bạn đến với trang quản trị. Vui lòng thiết lập mật khẩu để bắt đầu.',
        userInviteExpiredMessage: 'Lời mời đã hết hạn. Vui lòng liên hệ quản trị viên để được gửi lại lời mời.',
        newPassword: 'Mật khẩu mới', confirmNewPassword: 'Xác nhận mật khẩu', mfaTitle: 'Xác thực bổ sung',
        mfaCodeInputHelp: 'Nhập mã từ ứng dụng xác thực', mfaText: 'Bạn đã bật xác thực hai bước. Vui lòng xác minh danh tính.',
        mfaMultipleText: 'Chọn nhà cung cấp xác thực hai bước', mfaCodeInput: 'Mã xác minh', mfaInvalidCode: 'Mã xác minh không hợp lệ',
        returnToLogin: 'Quay lại đăng nhập', localLoginDisabled: 'Nhà cung cấp đã tắt chức năng đăng nhập trực tiếp.',
        friendlyGreeting: 'Xin chào', requiredEmailValidationMessage: 'Vui lòng nhập địa chỉ thư điện tử',
        requiredUsernameValidationMessage: 'Vui lòng nhập tên đăng nhập', requiredPasswordValidationMessage: 'Vui lòng nhập mật khẩu',
        showPassword: 'Hiện mật khẩu', hidePassword: 'Ẩn mật khẩu', invalidPasswordMessage: 'Mật khẩu chưa đủ mạnh.'
    },
    publicAccess: {
        paProtectedByAncestor: 'Cấu hình truy cập công khai được kế thừa từ trang cấp trên.',
        psHeadlineSetup: 'Thiết lập truy cập công khai', psHeadlineEdit: 'Sửa truy cập công khai',
        psActionSetup: 'Thiết lập', psActionEdit: 'Chỉnh sửa'
    },
    unpublish: { inProgress: 'Đang hủy xuất bản, vui lòng chờ...' },
    dynamicRoot: { originContentRootTitle: 'Gốc nội dung', originContentRootDesc: 'Mục gốc của cây nội dung', originSiteTitle: 'Trang web' },
    propertyEditorPicker: { selectAction: 'Chọn trình biên tập thuộc tính' },
    propertyEditorUIGroups: {
        advanced: 'Nâng cao', blocks: 'Khối nội dung', common: 'Thông dụng', date: 'Ngày tháng', lists: 'Danh sách',
        media: 'Phương tiện', people: 'Người dùng', pickers: 'Bộ chọn', richContent: 'Nội dung định dạng'
    },
    rollback: { contentRolledBack: 'Đã khôi phục nội dung', elementRolledBack: 'Đã khôi phục phần tử' },
    sections: { marketplace: 'Kho tiện ích' },
    settings: { changeIcon: 'Đổi biểu tượng', stylesheet: 'Biểu định kiểu', script: 'Mã kịch bản', tab: 'Thẻ', newtabname: 'Tên thẻ mới' },
    speechBubbles: {
        editContentPublishedFailed: 'Không thể lưu hoặc xuất bản tài liệu', editElementPublishedFailed: 'Không thể lưu hoặc xuất bản phần tử',
        editElementPublishedHeader: 'Đã xuất bản phần tử', editContentPublishedReloadFailed: 'Đã xuất bản tài liệu nhưng không thể tải lại trình biên tập',
        editElementPublishedReloadFailed: 'Đã xuất bản phần tử nhưng không thể tải lại trình biên tập',
        editElementUnpublishedHeader: 'Đã hủy xuất bản phần tử', editVariantElementPublishedText: 'Đã xuất bản %0%',
        cannotCopyToClipboard: 'Không thể sao chép vào bộ nhớ tạm', editMultiContentPublishedPartialText: 'Đã xuất bản %0% trên %1% tài liệu.',
        editMultiElementPublishedText: 'Đã xuất bản %0% phần tử', editMultiContentUnpublishedPartialText: 'Đã hủy xuất bản %0% trên %1% tài liệu.',
        editMultiElementUnpublishedText: 'Đã hủy xuất bản %0% phần tử', editMultiElementVariantPublishedText: 'Đã xuất bản %0% phần tử cho các ngôn ngữ %1%',
        editMultiElementVariantUnpublishedText: 'Đã hủy xuất bản %0% phần tử cho các ngôn ngữ %1%', offlineHeadline: 'Mất kết nối', onlineHeadline: 'Đã kết nối'
    },
    template: {
        notAllowed: 'Mẫu được chọn không còn được phép dùng cho loại tài liệu này.', productionMode: 'Chế độ vận hành',
        layouttemplate: 'Mẫu bố cục', noLayout: 'Không có bố cục', mastertemplate: 'Mẫu chính',
        insertPartialView: 'Thành phần giao diện', insertMacro: 'Đoạn mã dùng chung', id: 'Mã định danh'
    },
    contentTypeEditor: {
        allowInLibraryHeading: 'Cho phép trong thư viện', allowInLibraryDescription: 'Cho phép biên tập viên tạo phần tử thuộc loại này trong thư viện.',
        suggestedEditors: 'Đề xuất', elementTypeOnlySupport: 'Chỉ áp dụng cho loại phần tử.', deleteTab: 'Xóa thẻ',
        compositions: 'Thành phần dùng chung', collection: 'Bộ sưu tập', collections: 'Các bộ sưu tập'
    },
    tree: { classicViewLabel: 'Dạng cây', cardViewLabel: 'Dạng thẻ', tableViewLabel: 'Dạng bảng', children: 'Mục con', noItems: 'Không có mục nào' },
    user: {
        passwordCopied: 'Đã sao chép mật khẩu', permissionsEntityGroup_element: 'Quyền đối với phần tử',
        'permissionsEntityGroup_element-folder': 'Quyền đối với thư mục phần tử',
        'permissionsEntityGroup_element-property-value': 'Quyền đối với giá trị thuộc tính phần tử',
        allowAccessToAllElements: 'Cho phép truy cập tất cả phần tử',
        userCreatedApiSuccessHelp: 'Thiết lập thông tin xác thực ứng dụng trong hồ sơ người dùng.',
        addUsersToGroupError: 'Không thể thêm người dùng vào nhóm.', removeUsersFromGroupError: 'Không thể xóa người dùng khỏi nhóm.',
        andMore: 'và %0% mục khác', avatarUploadSuccess: 'Đã tải lên ảnh đại diện', avatarDeleteSuccess: 'Đã xóa ảnh đại diện',
        unknownFailure: 'Lỗi chưa xác định', usersNotManagedFromGroup: 'không thể quản lý từ màn hình này.',
        selectElementStartNode: 'Chọn mục gốc phần tử', selectElementStartNodeDescription: 'Giới hạn thư viện phần tử vào mục gốc đã chọn',
        mediastartnodes: 'Mục gốc phương tiện', modules: 'Khu vực quản trị'
    },
    userPermissions: {
        create: 'Tạo mới', create_element: 'Cho phép tạo phần tử', create_element_folder: 'Cho phép tạo thư mục phần tử',
        delete: 'Xóa', delete_element: 'Cho phép xóa phần tử', delete_element_folder: 'Cho phép xóa thư mục phần tử',
        duplicate: 'Sao chép', duplicate_element: 'Cho phép sao chép phần tử', granular_element: 'Phân quyền cho từng phần tử',
        granular_elementFolder: 'Phân quyền cho từng thư mục phần tử', move: 'Di chuyển', move_element: 'Cho phép di chuyển phần tử',
        move_element_folder: 'Cho phép di chuyển thư mục phần tử', publish: 'Xuất bản', publish_element: 'Cho phép xuất bản phần tử',
        read: 'Đọc', read_element: 'Cho phép đọc phần tử', read_element_folder: 'Cho phép đọc thư mục phần tử',
        rollback: 'Khôi phục phiên bản', rollback_element: 'Cho phép khôi phục phần tử về phiên bản trước',
        unpublish: 'Hủy xuất bản', unpublish_element: 'Cho phép hủy xuất bản phần tử', update: 'Cập nhật',
        update_element: 'Cho phép lưu phần tử', update_element_folder: 'Cho phép lưu thư mục phần tử'
    },
    validation: {
        validationPattern: 'Mẫu kiểm tra dữ liệu', mandatoryMessageLabel: 'Thông báo kiểm tra dữ liệu',
        rangeExceeds: 'Giá trị nhỏ nhất không được vượt quá giá trị lớn nhất.', minimumRange: 'Khoảng cách giữa hai giá trị phải đạt ít nhất %0%.',
        aliasInvalidFormat: 'Bí danh không được chứa ký tự đặc biệt'
    },
    redirectUrls: {
        disableUrlTrackerInstruction: 'Theo dõi chuyển hướng được quản lý trong cấu hình ứng dụng. Để tắt, đặt khóa cấu hình sau thành true:',
        enableUrlTrackerInstruction: 'Theo dõi chuyển hướng được quản lý trong cấu hình ứng dụng. Để bật, đặt khóa cấu hình sau thành false:',
        noRedirectsForSearch: 'Không có chuyển hướng phù hợp', noRedirectsForSearchDescription: 'Kiểm tra lại nội dung tìm kiếm và lỗi chính tả.'
    },
    embeddedMedia: { dimensionsDescription: 'Các giá trị này là chiều rộng và chiều cao tối đa gửi đến nhà cung cấp nội dung nhúng. Nhà cung cấp có thể điều chỉnh kích thước theo giới hạn riêng.' },
    textbox: { maxCharsLabel: 'Số ký tự tối đa', autocompleteLabel: 'Tự động hoàn thành' },
    recycleBin: {
        restoreItemTo: (from, to) => `Khôi phục <strong>${from}</strong> vào <strong>${to}</strong>`,
        restoreToTitle: 'Khôi phục vào', selectRestoreLocation: 'Chọn vị trí khôi phục'
    },
    dashboardTabs: { libraryWelcome: 'Giới thiệu', settingsModelsBuilder: 'Tạo mô hình dữ liệu', settingsHealthCheck: 'Kiểm tra hệ thống', settingsProfiler: 'Phân tích hiệu năng' },
    logViewer: {
        refreshSearch: 'Tải lại kết quả', messagesCount: 'bản ghi nhật ký', noResults: 'Không tìm thấy kết quả phù hợp.',
        sortLogs: 'Sắp xếp nhật ký', loadingLogs: 'Đang tải nhật ký...', searchLogs: 'Tìm nhật ký', searchLogsPlaceholder: 'Tìm trong nhật ký...',
        searchFor: 'Tìm %0%', findLogsWith: 'Tìm nhật ký chứa %0%', query: 'Truy vấn', searchName: 'Tên tìm kiếm',
        startPolling: 'Bật cập nhật định kỳ', choosePollingInterval: 'Chọn chu kỳ cập nhật', selectLogLevels: 'Chọn mức nhật ký',
        all: 'Tất cả', from: 'Từ', to: 'Đến', unableToViewLogs: 'Không thể xem nhật ký',
        logFileTooLarge: 'Tệp nhật ký hôm nay quá lớn để xem trực tiếp và có thể ảnh hưởng hiệu năng.',
        narrowDateRangeOrOpenManually: 'Thu hẹp khoảng thời gian hoặc mở tệp nhật ký trực tiếp.', timePeriod: 'Khoảng thời gian',
        numberOfErrors: 'Số lỗi', showErrorLogs: 'Hiện nhật ký lỗi', allLogs: 'Tất cả nhật ký', commonLogMessages: 'Thông báo thường gặp',
        totalUniqueMessageTypes: 'Tổng số loại thông báo khác nhau: %0%', logTypes: 'Loại nhật ký',
        logTypesChartDescription: 'Số bản ghi nhật ký trong khoảng thời gian đã chọn, phân theo loại:', viewLogsLabel: 'Xem %0% bản ghi'
    },
    clipboard: {
        confirmClearDescription: 'Bạn có chắc chắn muốn xóa bộ nhớ tạm?', confirmPasteHeadline: 'Dán từ bộ nhớ tạm',
        confirmPasteOverwriteMessage: name => `Thuộc tính đã có giá trị. Bạn có muốn thay giá trị hiện tại bằng <strong>${name}</strong>?`
    },
    profiling: {
        errorEnablingProfilerTitle: 'Không thể bật phân tích hiệu năng',
        errorEnablingProfilerDescription: 'Kiểm tra trang quản trị và trang công khai có dùng cùng địa chỉ rồi thử lại. Nếu lỗi tiếp diễn, hãy kiểm tra nhật ký.',
        errorDisablingProfilerTitle: 'Không thể tắt phân tích hiệu năng',
        errorDisablingProfilerDescription: 'Vui lòng thử lại. Nếu lỗi tiếp diễn, hãy kiểm tra nhật ký.'
    },
    libraryDashboard: { welcomeHeader: 'Chào mừng đến với thư viện' },
    welcomeDashboard: {
        umbracoForumHeadline: 'Diễn đàn cộng đồng Umbraco',
        umbracoForumDescription: 'Nơi đặt câu hỏi, chia sẻ kiến thức và trao đổi với cộng đồng phát triển Umbraco.',
        umbracoForumButton: 'Truy cập diễn đàn Umbraco', umbracoCommunityHeadline: 'Cộng đồng Umbraco',
        umbracoCommunityDescription: 'Kết nối, đóng góp mã nguồn, tài liệu, kiểm thử và ý kiến cho cộng đồng Umbraco.'
    },
    blockEditor: {
        labelCreateModalSize: 'Kích thước hộp thoại tạo mới', confirmDeleteBlockTypeTitle: 'Xóa cấu hình khối?',
        rangeAllowed: 'Số lượng khối', specifiedAllowance: 'Loại khối được phép', tabClipboard: 'Bộ nhớ tạm',
        headlineCreateBlock: 'Chọn loại phần tử', headlineAddSettingsElementType: 'Gắn loại phần tử cho cài đặt',
        labelcreateNewElementType: 'Tạo loại phần tử mới', headlineAddCustomStylesheet: 'Chọn biểu định kiểu',
        labelCustomStylesheet: 'Biểu định kiểu tùy chỉnh', addCustomStylesheet: 'Thêm biểu định kiểu',
        labelEditorSize: 'Kích thước hộp thoại biên tập', elementTypeDoesNotExist: 'Không thể chỉnh sửa vì loại phần tử không tồn tại.'
    },
    preview: {
        connectionFailed: 'Không thể kết nối máy chủ. Bản xem trước sẽ không tự cập nhật.',
        connectionLost: 'Đã mất kết nối máy chủ. Bản xem trước sẽ không tự cập nhật.'
    },
    rte: {
        label: 'Trình soạn thảo văn bản', config_allowedMediaTypes: 'Loại phương tiện được phép',
        config_allowedMediaTypes_description: 'Giới hạn loại phương tiện trong bộ chọn và khi kéo thả tải lên.'
    },
    tiptap: {
        extGroup_html: 'HTML', toobar_availableItems: 'Thao tác có sẵn', toobar_availableItemsEmpty: 'Không có tiện ích thanh công cụ để hiển thị',
        anchor: 'Mã neo', config_statusbar: 'Thanh trạng thái', config_toolbar: 'Thanh công cụ'
    },
    linkPicker: {
        modalUrlOrAnchorValidationMessage: 'Vui lòng nhập địa chỉ liên kết hoặc mã neo.', selectLanguageHint: 'Chọn ngôn ngữ cho liên kết',
        selectLanguageDefault: 'Tự động (theo ngôn ngữ người truy cập)', configCultureSpecificDocumentLinksLabel: 'Liên kết tài liệu theo ngôn ngữ',
        configCultureSpecificDocumentLinksDescription: 'Cho phép chỉ định ngôn ngữ khi liên kết đến tài liệu.',
        modalAnchorValidationMessage: 'Nhập mã neo hoặc chuỗi truy vấn, chọn tài liệu hoặc tệp phương tiện, hoặc nhập địa chỉ liên kết.'
    },
    missingEditor: {
        title: 'Loại thuộc tính này không còn khả dụng.', description: 'Nội dung vẫn được giữ an toàn. Xuất bản tài liệu sẽ không ghi đè hoặc xóa nội dung này.<br/>Vui lòng liên hệ quản trị viên để xử lý.',
        detailsTitle: 'Thông tin bổ sung', detailsDescription: 'Khôi phục trình biên tập thuộc tính, chuyển sang loại dữ liệu được hỗ trợ hoặc xóa thuộc tính nếu không còn cần thiết.',
        detailsDataType: 'Loại dữ liệu', detailsPropertyEditor: 'Trình biên tập thuộc tính', detailsPropertyEditorUi: 'Giao diện biên tập thuộc tính',
        detailsData: 'Dữ liệu', detailsHide: 'Ẩn chi tiết', detailsShow: 'Hiện chi tiết', missingUiTitle: 'Không tìm thấy giao diện biên tập thuộc tính đã cấu hình.',
        missingUiDetailsDescription: 'Kiểm tra giao diện tùy chỉnh đã được đăng ký và bí danh khớp với cấu hình.<br/>Xem <a href="https://docs.umbraco.com/umbraco-cms/customizing/property-editors/composition/property-editor-ui" target="_blank" rel="noopener">tài liệu hướng dẫn</a>.',
        dataTypeMissingEditor: 'Không tìm thấy trình biên tập thuộc tính', dataTypeMissingEditorMessage: 'Trình biên tập thuộc tính này không tồn tại.',
        dataTypeMissingEditorUi: 'Không tìm thấy giao diện biên tập thuộc tính', dataTypeMissingEditorUiMessage: 'Giao diện biên tập thuộc tính này không tồn tại.'
    },
    dateTimePicker: {
        local: 'Giờ địa phương', differentTimeZoneLabel: (offset, localDate) => `Thời gian đã chọn (${offset}) tương ứng ${localDate} theo giờ địa phương của bạn.`,
        config_format: 'Định dạng', config_format_datetime: 'Ngày và giờ', config_format_dateOnly: 'Chỉ ngày', config_format_timeOnly: 'Chỉ giờ',
        config_timeFormat: 'Định dạng giờ', config_timeZones: 'Múi giờ', config_timeZones_description: 'Chọn các múi giờ biên tập viên được phép sử dụng.',
        config_timeZones_all: 'Tất cả múi giờ', config_timeZones_local: 'Chỉ múi giờ địa phương', config_timeZones_custom: 'Danh sách múi giờ tùy chỉnh',
        emptyDate: 'Vui lòng chọn ngày', emptyTimeZone: 'Vui lòng chọn múi giờ', invalidTimeZone: 'Múi giờ đã chọn không hợp lệ'
    },
    mediaPicker: { tabClipboard: 'Bộ nhớ tạm' },
    packager: { actions: 'Thao tác', packageNetVersion: 'Phiên bản .NET' },
    stylesheet: { selector: 'Bộ chọn' },
    grid: { styles: 'Kiểu hiển thị', macro: 'Đoạn mã dùng chung' },
    templateEditor: { casing: 'Kiểu chữ hoa, chữ thường' },
    treeHeaders: { macros: 'Đoạn mã dùng chung', partialViews: 'Thành phần giao diện', partialViewMacros: 'Tệp giao diện của đoạn mã dùng chung', relations: 'Quan hệ', webhooks: 'Thông báo qua webhook', scripts: 'Tệp mã kịch bản', stylesheets: 'Tệp định kiểu', templates: 'Tệp mẫu giao diện', mediaTypes: 'Loại phương tiện' },
    visuallyHiddenTexts: { newPartialView: 'Thành phần giao diện', newPartialViewMacro: 'Giao diện của đoạn mã dùng chung' },
    settingsDashboard: { videosHeader: 'Video hướng dẫn' },
    codeEditor: { minimapConfigLabel: 'Bản đồ mã thu nhỏ' },
    uiCulture: {
        ar: 'Tiếng Ả Rập', bs: 'Tiếng Bosnia', cs: 'Tiếng Séc', 'cs-cz': 'Tiếng Séc (Séc)', cy: 'Tiếng Wales', 'cy-gb': 'Tiếng Wales (Anh)',
        da: 'Tiếng Đan Mạch', 'da-dk': 'Tiếng Đan Mạch (Đan Mạch)', de: 'Tiếng Đức', 'de-de': 'Tiếng Đức (Đức)', 'de-ch': 'Tiếng Đức (Thụy Sĩ)',
        en: 'Tiếng Anh (Anh)', 'en-us': 'Tiếng Anh (Mỹ)', es: 'Tiếng Tây Ban Nha', 'es-es': 'Tiếng Tây Ban Nha (Tây Ban Nha)',
        fr: 'Tiếng Pháp', 'fr-fr': 'Tiếng Pháp (Pháp)', 'fr-ch': 'Tiếng Pháp (Thụy Sĩ)', he: 'Tiếng Do Thái', 'he-il': 'Tiếng Do Thái (Israel)',
        hr: 'Tiếng Croatia', 'hr-hr': 'Tiếng Croatia (Croatia)', it: 'Tiếng Ý', 'it-it': 'Tiếng Ý (Ý)', 'it-ch': 'Tiếng Ý (Thụy Sĩ)',
        ja: 'Tiếng Nhật', 'ja-jp': 'Tiếng Nhật (Nhật Bản)', ko: 'Tiếng Hàn', 'ko-kr': 'Tiếng Hàn (Hàn Quốc)', nb: 'Tiếng Na Uy (Bokmål)',
        'nb-no': 'Tiếng Na Uy (Na Uy)', nl: 'Tiếng Hà Lan', 'nl-nl': 'Tiếng Hà Lan (Hà Lan)', pl: 'Tiếng Ba Lan', 'pl-pl': 'Tiếng Ba Lan (Ba Lan)',
        pt: 'Tiếng Bồ Đào Nha', 'pt-br': 'Tiếng Bồ Đào Nha (Brazil)', ro: 'Tiếng Romania', 'ro-ro': 'Tiếng Romania (Romania)',
        ru: 'Tiếng Nga', 'ru-ru': 'Tiếng Nga (Nga)', sv: 'Tiếng Thụy Điển', 'sv-se': 'Tiếng Thụy Điển (Thụy Điển)',
        tr: 'Tiếng Thổ Nhĩ Kỳ', 'tr-tr': 'Tiếng Thổ Nhĩ Kỳ (Thổ Nhĩ Kỳ)', uk: 'Tiếng Ukraina', 'uk-ua': 'Tiếng Ukraina (Ukraina)',
        zh: 'Tiếng Trung', 'zh-cn': 'Tiếng Trung (giản thể, Trung Quốc)', 'zh-tw': 'Tiếng Trung (phồn thể, Đài Loan)', vi: 'Tiếng Việt', 'vi-vn': 'Tiếng Việt (Việt Nam)'
    }
};
