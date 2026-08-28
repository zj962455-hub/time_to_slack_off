use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // macOS: 设为 accessory（菜单栏常驻，不在 dock）
            #[cfg(target_os = "macos")]
            {
                use tauri::ActivationPolicy;
                let _ = app.set_activation_policy(ActivationPolicy::Accessory);
            }

            // 托盘菜单
            let show_item = MenuItem::with_id(app, "show", "显示主界面", true, None::<&str>)?;
            let hide_item = MenuItem::with_id(app, "hide", "隐藏主界面", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("摸鱼时钟")
                .menu(&menu)
                .show_menu_on_left_click(false) // 左键点击直接切换窗口
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => toggle_main_window(app, Some(true)),
                    "hide" => toggle_main_window(app, Some(false)),
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
            let _ = window.set_focus();
            // macOS accessory 模式下，从隐藏状态显示需要 unhide app
            #[cfg(target_os = "macos")]
            {
                let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
            }
        } else {
            let _ = window.hide();
            // macOS: 隐藏后回到 accessory 模式（不在 dock）
            #[cfg(target_os = "macos")]
            {
                let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }
        }
    }
}