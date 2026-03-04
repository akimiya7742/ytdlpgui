"use client"
import React, { useState, useEffect, useRef } from 'react';
import { 
	Download, 
	Youtube, 
	CheckCircle, 
	AlertCircle, 
	Loader2, 
	FileVideo, 
	Music, 
	FolderOpen, 
	Tag, 
	Image as ImageIcon,
	Settings2,
	Terminal,
	ChevronDown,
	ChevronUp
} from 'lucide-react';
import { Command } from '@tauri-apps/plugin-shell';
import { open } from '@tauri-apps/plugin-dialog';

export default function App() {
	const [url, setUrl] = useState<string>('');
	const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');
	const [quality, setQuality] = useState<string>('best');
	const [savePath, setSavePath] = useState<string>('');
	const [addMetadata, setAddMetadata] = useState<boolean>(true);
	const [embedThumbnail, setEmbedThumbnail] = useState<boolean>(true);
	
	// Nâng cao
	const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
	const [customArgs, setCustomArgs] = useState<string>('');
	const [showLogs, setShowLogs] = useState<boolean>(true);
	
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState<string>('');
	const [logs, setLogs] = useState<string[]>([]);

	const logEndRef = useRef<HTMLDivElement>(null);

	// Tự động cuộn xuống khi có log mới
	useEffect(() => {
		if (showLogs) {
			logEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [logs, showLogs]);

	// Hàm chọn thư mục qua Tauri v2 Dialog
	const handleSelectFolder = async () => {
		try {
			const selected = await open({
				directory: true,
				multiple: false,
				title: 'Chọn thư mục lưu video'
			});
			if (selected) {
				// Trong v2, open có thể trả về string hoặc string[]
				setSavePath(Array.isArray(selected) ? selected[0] : selected);
			}
		} catch (err) {
			console.error("Lỗi chọn thư mục:", err);
		}
	};

	const handleDownload = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!url) {
			setStatus('error');
			setMessage('Vui lòng nhập đường dẫn YouTube!');
			return;
		}

		if (!savePath) {
			setStatus('error');
			setMessage('Vui lòng chọn thư mục lưu trữ!');
			return;
		}

		setStatus('loading');
		setLogs(['Đang khởi tạo engine yt-dlp...', 'Đang kiểm tra thông tin video...']);

		// Xây dựng tham số cho yt-dlp
		let commandArgs = [
			url,
			'--newline',
			'--no-colors',          // Loại bỏ mã màu ANSI (gây lỗi encoding)
			'--encoding', 'utf-8',  // Chỉ định rõ encoding output
			'-o', `${savePath}/%(title)s.%(ext)s`,
		];

		if (format === 'mp3') {
			commandArgs.push('-x', '--audio-format', 'mp3');
		} else {
			// Nếu là mp4, có thể thêm logic chọn chất lượng dựa trên state 'quality'
			if (quality !== 'best') {
				commandArgs.push('-f', `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`);
			}
		}

		if (addMetadata) commandArgs.push('--add-metadata');
		if (embedThumbnail) commandArgs.push('--embed-thumbnail');
		
		// Thêm custom args nếu có
		if (customArgs.trim()) {
			const extra = customArgs.trim().split(/\s+/);
			commandArgs = [...commandArgs, ...extra];
		}

		try {
			const command = Command.create("bin/yt-dlp", commandArgs);

			// Đăng ký listener TRƯỚC khi gọi spawn
			command.stdout.on("data", (line: string) => {
				// yt-dlp đôi khi gửi nhiều dòng một lúc, trim() giúp sạch sẽ hơn
				setLogs(prev => [...prev, line.trim()]);
			});

			command.stderr.on("data", (line: string) => {
				setLogs(prev => [...prev, `⚠️ ${line.trim()}`]);
			});

			command.on("close", (data) => {
				if (data.code === 0) {
					setStatus("success");
					setMessage("Tải xuống thành công!");
					setLogs(prev => [...prev, "--- HOÀN TẤT ---"]);
				} else {
					setStatus("error");
					setMessage(`Thất bại với mã lỗi: ${data.code}`);
				}
			});

			command.on("error", (error) => {
				setLogs(prev => [...prev, `CRITICAL ERROR: ${error}`]);
			});

			// SỬ DỤNG SPAWN THAY VÌ EXECUTE
			const child = await command.spawn();
			
			// Nếu bạn muốn có nút "Hủy", bạn có thể lưu 'child' vào một useRef
			// child.kill(); 

		} catch (err: any) {
			console.error(err);
			setStatus('error');
			setMessage(err.toString());
		}
	};

	return (
		<div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
			<style dangerouslySetInnerHTML={{ __html: `
				@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
				:root {
					--font-quicksand: 'Quicksand', sans-serif;
					--font-mono: 'JetBrains Mono', monospace;
				}
				.font-sans { font-family: var(--font-quicksand) !important; }
				.font-mono { font-family: var(--font-mono) !important; }
				::-webkit-scrollbar { width: 6px; }
				::-webkit-scrollbar-track { background: transparent; }
				::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
			`}} />

			<div className="max-w-3xl mx-auto">
				{/* Header */}
				<div className="flex items-center gap-4 mb-8">
					<div className="bg-red-600 p-2.5 rounded-xl shadow-lg shadow-red-900/30">
						<Youtube size={32} className="text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">YouTube Downloader Pro</h1>
						<p className="text-slate-400 text-sm font-medium">Tauri v2 + yt-dlp Engine</p>
					</div>
				</div>

				<div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-7 shadow-2xl border border-slate-700/50">
					<form onSubmit={handleDownload} className="space-y-6">
						{/* URL Input */}
						<div>
							<label className="block text-xs font-bold uppercase tracking-widest mb-2 text-slate-400">Đường dẫn Video</label>
							<input
								type="text"
								placeholder="Dán link YouTube tại đây..."
								className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all text-white"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
							/>
						</div>

						{/* Path Selection */}
						<div>
							<label className="block text-xs font-bold uppercase tracking-widest mb-2 text-slate-400">Nơi lưu trữ</label>
							<div className="flex gap-2">
								<div className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl py-3.5 px-4 text-slate-300 text-sm truncate font-mono">
									{savePath || "Chọn thư mục lưu..."}
								</div>
								<button
									type="button"
									onClick={handleSelectFolder}
									className="bg-slate-700 hover:bg-slate-600 px-5 rounded-xl transition-all flex items-center gap-2 border border-slate-600 active:scale-95 shrink-0"
								>
									<FolderOpen size={18} className="text-red-400" />
									<span className="font-semibold text-sm">Chọn</span>
								</button>
							</div>
						</div>

						{/* Options */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div className="space-y-4">
								<label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Định dạng</label>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setFormat('mp4')}
										className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold ${format === 'mp4' ? 'bg-red-600 border-red-500 shadow-lg' : 'bg-slate-900 border-slate-700 opacity-60'}`}
									>
										<FileVideo size={18} /> MP4
									</button>
									<button
										type="button"
										onClick={() => setFormat('mp3')}
										className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all font-bold ${format === 'mp3' ? 'bg-red-600 border-red-500 shadow-lg' : 'bg-slate-900 border-slate-700 opacity-60'}`}
									>
										<Music size={18} /> MP3
									</button>
								</div>
								
								<select 
									value={quality}
									onChange={(e) => setQuality(e.target.value)}
									className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-3 outline-none focus:border-red-500 text-white font-medium"
								>
									<option value="best">Chất lượng cao nhất</option>
									<option value="1080">1080p (Full HD)</option>
									<option value="720">720p (HD)</option>
									<option value="480">480p</option>
								</select>
							</div>

							<div className="space-y-4">
								<label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Tùy chỉnh nhanh</label>
								<div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
									<label className="flex items-center gap-3 cursor-pointer group">
										<div className="relative">
											<input type="checkbox" checked={addMetadata} onChange={() => setAddMetadata(!addMetadata)} className="sr-only peer"/>
											<div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-red-600 transition-colors"></div>
											<div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
										</div>
										<span className="text-sm font-medium text-slate-400 group-hover:text-slate-200"><Tag size={14} className="inline mr-1"/> Metadata</span>
									</label>
									<label className="flex items-center gap-3 cursor-pointer group">
										<div className="relative">
											<input type="checkbox" checked={embedThumbnail} onChange={() => setEmbedThumbnail(!embedThumbnail)} className="sr-only peer"/>
											<div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-red-600 transition-colors"></div>
											<div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
										</div>
										<span className="text-sm font-medium text-slate-400 group-hover:text-slate-200"><ImageIcon size={14} className="inline mr-1"/> Nhúng Thumbnail</span>
									</label>
								</div>
							</div>
						</div>

						{/* Advanced */}
						<div className="pt-2 border-t border-slate-700/50">
							<button
								type="button"
								onClick={() => setShowAdvanced(!showAdvanced)}
								className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300"
							>
								<Settings2 size={14} /> Tùy chọn nâng cao {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
							</button>

							{showAdvanced && (
								<div className="mt-4 space-y-4">
									<textarea
										placeholder="Thêm tham số yt-dlp (Ví dụ: --no-playlist)"
										className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-300 focus:border-red-500 outline-none h-20 resize-none"
										value={customArgs}
										onChange={(e) => setCustomArgs(e.target.value)}
									/>
									<label className="flex items-center gap-3 cursor-pointer w-fit">
										<input type="checkbox" checked={showLogs} onChange={() => setShowLogs(!showLogs)} className="rounded border-slate-700 bg-slate-900 text-red-600"/>
										<span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Terminal size={12}/> Hiển thị Log</span>
									</label>
								</div>
							)}
						</div>

						<button
							type="submit"
							disabled={status === 'loading'}
							className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase ${status === 'loading' ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700'}`}
						>
							{status === 'loading' ? <><Loader2 className="animate-spin" /> Đang tải...</> : <><Download size={22} /> Tải về ngay</>}
						</button>
					</form>

					{/* Feedback */}
					{status === 'success' && (
						<div className="mt-6 p-4 bg-green-950/30 border border-green-800/50 rounded-xl flex items-center gap-3 text-green-400">
							<CheckCircle size={20} /> <p className="text-sm font-medium">{message}</p>
						</div>
					)}
					{status === 'error' && (
						<div className="mt-6 p-4 bg-red-950/30 border border-red-800/50 rounded-xl flex items-center gap-3 text-red-400">
							<AlertCircle size={20} /> <p className="text-sm font-medium">{message}</p>
						</div>
					)}

					{/* Logs */}
					{showLogs && logs.length > 0 && (
						<div className="mt-8">
							<div className="flex justify-between items-center mb-2 px-1">
								<h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Logs</h3>
								<button onClick={() => setLogs([])} className="text-[9px] text-slate-600 hover:text-slate-400 uppercase">Clear</button>
							</div>
							<div className="bg-black/60 rounded-xl p-5 h-56 overflow-y-auto font-mono text-[11px] border border-slate-700/30 space-y-1 shadow-inner">
								{logs.map((log, i) => (
									<div key={i} className="flex gap-3 border-b border-white/5 pb-0.5 last:border-0">
										<span className="text-slate-700 w-4 shrink-0">{i + 1}</span>
										<span className={`${log.includes('ERROR') ? 'text-red-500' : 'text-slate-400'}`}>{log}</span>
									</div>
								))}
								<div ref={logEndRef} />
							</div>
						</div>
					)}
				</div>

				<div className="mt-8 flex justify-center gap-4 opacity-40 grayscale hover:grayscale-0 transition-all">
					<div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-mono">
						<span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> YT-DLP CORE
					</div>
					<div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-mono">
						<span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> FFMPEG
					</div>
				</div>
			</div>
		</div>
	);
}