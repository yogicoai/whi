"use client";

// 라벨 촬영 — 보틀 렌즈 components/CaptureScreen.js 를 옮겼다(2026-10-28). 라벨 한 장만 찍는다(바코드 · 와인 리스트 모드는 이 앱에 없다).
// 카메라 켜기 · 확대(기기 줌 → 안 되면 화면 확대 후 가운데 잘라 찍기) · 두 손가락 확대 · 두 번 두드려 2× · 앨범에서 고르기 · 붙여넣기 · 끌어 놓기.

import { useEffect, useRef, useState } from "react";
import { readImageFile } from "@/lib/imageClient";
import Icon from "./Icon";

const MAX_DIGITAL_ZOOM = 4;

export default function CaptureScreen({ onCapture }) {
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [starting, setStarting] = useState(false);
  const [camError, setCamError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [zoomCaps, setZoomCaps] = useState(null); // 기기 줌 사양 — 없으면 null 이고 화면 확대로 넘어간다

  // 카메라는 화면에 들어오자마자 켜지 않는다 — 사용자가 시작할 때 권한을 물어야 거부감이 적고 배터리에도 낫다
  async function startCamera() {
    if (stream || starting) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError("이 브라우저는 카메라를 쓸 수 없어요. 사진을 올려 주세요.");
      return;
    }
    setStarting(true);
    setCamError(null);
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      });
      setStream(acquired);
    } catch (err) {
      setCamError(
        err?.name === "NotAllowedError"
          ? "카메라 권한이 막혀 있어요. 브라우저 설정에서 허용하거나 사진을 올려 주세요."
          : "카메라를 쓸 수 없어요. 사진을 올려 주세요."
      );
    } finally {
      setStarting(false);
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }

  // 화면을 벗어나면 카메라를 반드시 끈다(표시등이 계속 켜져 있으면 불안하다)
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  // 카메라가 켜지면 이 기기가 줌을 지원하는지 묻는다
  useEffect(() => {
    setZoom(1);
    const track = stream?.getVideoTracks?.()[0];
    if (!track?.getCapabilities) return setZoomCaps(null);
    let caps = null;
    try {
      caps = track.getCapabilities();
    } catch {
      /* 일부 브라우저는 준비 전에 부르면 던진다 */
    }
    setZoomCaps(caps?.zoom && caps.zoom.max > caps.zoom.min ? { min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1 } : null);
  }, [stream]);

  const maxZoom = zoomCaps ? zoomCaps.max : MAX_DIGITAL_ZOOM;
  const minZoom = zoomCaps ? zoomCaps.min : 1;

  function applyZoom(next) {
    const clamped = Math.min(maxZoom, Math.max(minZoom, Number(next) || 1));
    setZoom(clamped);
    if (!zoomCaps) return;
    stream?.getVideoTracks?.()[0]?.applyConstraints?.({ advanced: [{ zoom: clamped }] }).catch(() => {});
  }

  // 손가락 두 개로 벌리고 오므리기
  const pinchRef = useRef(null);
  const touchDistance = (e) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  function onTouchStart(e) {
    if (e.touches.length === 2) pinchRef.current = { dist: touchDistance(e), zoom };
  }
  function onTouchMove(e) {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    applyZoom(pinchRef.current.zoom * (touchDistance(e) / pinchRef.current.dist));
  }
  function onTouchEnd(e) {
    if (e.touches.length < 2) pinchRef.current = null;
  }

  // 스트림을 video 에 연결 — video 는 늘 그려 두므로 바뀌지 않는다(조건부로 두 번 그리면 검은 화면이 된다)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.muted = true; // iOS 자동 재생 조건
    video.setAttribute("playsinline", "");
    const play = () => video.play().catch(() => {});
    play();
    video.addEventListener("loadedmetadata", play); // iOS 에서 첫 play() 가 무시되면 한 번 더
    return () => video.removeEventListener("loadedmetadata", play);
  }, [stream]);

  // 셔터: 카메라가 꺼져 있으면 켜고, 켜져 있으면 찍는다
  function onShutter() {
    if (!stream) return startCamera();
    shoot();
  }

  function shoot() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    // 기기 줌은 이미 프레임에 들어 있다. 화면 확대일 때만 보이는 만큼 가운데를 잘라 낸다 — 화면과 결과가 어긋나면 안 된다
    const digital = !zoomCaps ? zoom : 1;
    const sw = video.videoWidth / digital;
    const sh = video.videoHeight / digital;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext("2d").drawImage(video, (video.videoWidth - sw) / 2, (video.videoHeight - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    if (navigator.vibrate) navigator.vibrate(30);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    onCapture(dataUrl);
  }

  async function handleFile(file) {
    setFileError(null);
    const read = await readImageFile(file);
    if (!read.ok) return setFileError(read.reason); // 조용히 무시하면 앱이 멈춘 줄 안다
    stopCamera();
    onCapture(read.dataUrl);
  }

  // 클립보드 붙여넣기(PC)
  const fileHandler = useRef(handleFile);
  fileHandler.current = handleFile;
  useEffect(() => {
    function onPaste(e) {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (item) fileHandler.current(item.getAsFile());
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const live = !!stream;

  return (
    <div
      className={`capture ${dragging ? "is-drag" : ""} ${live ? "cap-live" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <div
        className="cam-frame"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onWheel={(e) => live && applyZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
        onDoubleClick={() => live && applyZoom(zoom > 1.2 ? minZoom : Math.min(2, maxZoom))}
      >
        {/* 늘 그려 둔다 — 준비 전에는 숨기기만 */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={live ? "cam-video" : "cam-video is-hidden"}
          style={zoomCaps || zoom === 1 ? undefined : { transform: `scale(${zoom})` }}
        />

        {live ? (
          <>
            <div className="cam-guide" />
            <div className="cam-guide-txt">라벨이 네모 안에 오도록 맞춰 주세요</div>
            {/* 확대 — 작은 글씨(숙성 연수 · 이름)는 당겨서 찍어야 읽힌다 */}
            <div className="zoom-bar" onDoubleClick={(e) => e.stopPropagation()}>
              <button type="button" className="zoom-step" aria-label="축소" onClick={() => applyZoom(zoom - (maxZoom - minZoom) / 10)} disabled={zoom <= minZoom + 0.001}>−</button>
              <input
                className="zoom-range"
                type="range"
                min={minZoom}
                max={maxZoom}
                step={zoomCaps ? zoomCaps.step : 0.05}
                value={zoom}
                aria-label="확대"
                onChange={(e) => applyZoom(e.target.value)}
              />
              <button type="button" className="zoom-step" aria-label="확대" onClick={() => applyZoom(zoom + (maxZoom - minZoom) / 10)} disabled={zoom >= maxZoom - 0.001}>+</button>
              <b className="zoom-val">{zoom.toFixed(1)}×</b>
            </div>
          </>
        ) : (
          <div className="cam-fallback">
            <span className="cam-big"><Icon name="camera" size={40} /></span>
            {camError ? (
              <p className="cam-msg err">{camError}</p>
            ) : (
              <p className="cam-msg">
                위스키 병 앞면 라벨을 찍으면
                <br />
                어떤 위스키인지 바로 찾아 드려요
              </p>
            )}
            <button type="button" className="btn-primary cam-start" onClick={startCamera} disabled={starting}>
              {starting ? "카메라 여는 중…" : camError ? "다시 해 보기" : "카메라 켜기"}
            </button>
            <button type="button" className="cam-alt" onClick={() => fileRef.current?.click()}>
              사진으로 올리기
            </button>
          </div>
        )}
      </div>

      <div className="cap-actions">
        <button type="button" className="side-btn" aria-label="앨범에서 고르기" onClick={() => fileRef.current?.click()}>
          <Icon name="image" size={22} />
        </button>
        <button type="button" className={`shutter ${live ? "" : "is-off"}`} aria-label={live ? "찍기" : "카메라 켜기"} onClick={onShutter} />
        {/* 찍는 동안 나가는 길 — 카메라를 끄면 아래 메뉴가 돌아온다 */}
        {live ? (
          <button type="button" className="side-btn" aria-label="카메라 끄기" onClick={stopCamera}>
            <Icon name="close" size={22} />
          </button>
        ) : (
          <span className="side-btn is-blank" aria-hidden="true" />
        )}
      </div>

      {fileError && <p className="drop-hint is-error" role="alert">{fileError}</p>}
      <p className="drop-hint">{live ? "라벨이 잘 보이게 맞추고 가운데 단추를 누르세요" : "가운데 단추를 누르면 카메라가 켜져요"}</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
