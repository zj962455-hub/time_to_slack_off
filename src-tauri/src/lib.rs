use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, PhysicalSize,
};

#[tauri::command]
fn set_widget_size(window: tauri::WebviewWindow, mode: String) {
    let size = match mode.as_str() {
        "small" => PhysicalSize::new(320, 140),
        "large" => PhysicalSize::new(460, 650),
        _ => return,
    };
    let _ = window.set_size(size);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![set_widget_size])
        .setup(|app| {
            // macOS: 设为主窗口为桌面 widget 风格
            if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focusable(false);
                    let _ = window.set_skip_taskbar(true);
                    let _ = window.set_visible_on_all_workspaces(true);

                    #[cfg(target_os = "macos")]
                    {
                        use objc::runtime::{NO, YES, Object};
                        use objc::{msg_send, sel, sel_impl};

                        let ns_window = window.ns_window().unwrap() as *mut Object;
                        unsafe {
                            // kCGDesktopIconWindowLevel = -2 (桌面图标之上，正常窗口之下)
                            let _: () = msg_send![ns_window, setLevel: -2i64];

                            // NSWindowCollectionBehavior:
                            //   1 = CanJoinAllSpaces（所有桌面空间可见）
                            //   8 = Transient（不在 Mission Control 显示）
                            let _: () = msg_send![ns_window, setCollectionBehavior: 1u64 | 8u64];

                            // 背景透明 + 无阴影（macOS 透明窗口必须显式）
                            let _: () = msg_send![ns_window, setOpaque: NO];
                            let _: () = msg_send![ns_window, setHasShadow: NO];

                            // 透明窗口拖动：必须启用 movableByWindowBackground
                            let _: () = msg_send![ns_window, setMovableByWindowBackground: YES];
                        }
                    }
            }

            // 托盘菜单（保留 P4 实现）
            let show_item = MenuItem::with_id(app, "show", "显示主界面", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "隐藏主界面", true, None::<&str>)?;
            let settings_item =
                MenuItem::with_id(app, "settings", "打开设置", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&show_item, &hide_item, &settings_item, &quit_item],
            )?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("摸鱼时钟")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => toggle_main_window(app, Some(true)),
                    "hide" => toggle_main_window(app, Some(false)),
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("open-settings", ());
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_main_window(tray.app_handle(), None);
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// 切换主窗口显示状态
///
/// `show = true`：强制显示
/// `show = false`：强制隐藏
/// `show = None`：自动 toggle
fn toggle_main_window(app: &tauri::AppHandle, show: Option<bool>) {
    if let Some(window) = app.get_webview_window("main") {
        let should_show = match show {
            Some(s) => s,
            None => !window.is_visible().unwrap_or(false),
        };

        if should_show {
            let _ = window.show();
        } else {
            let _ = window.hide();
        }
    }
}