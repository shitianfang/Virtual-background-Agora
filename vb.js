const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

const imageList = [
  {
    url: "./images/tainan.jpeg",
    alt: 'tainan'
  },
  {
    url: './images/taipei.jpeg',
    alt: 'taipei'
  },
  {
    url: './images/japan.jpeg',
    alt: 'japan'
  },
  {
    url: './images/egypt.webp',
    alt: 'egypt'
  }
];


let globalController = null;
let timestamp = null;
let stream = null;
let customBackgroundImage = new Image();

const $sectionCustomImages = document.querySelector('.sectionCustomImages');
const $uploadInput = document.querySelector('.uploadInput');

const selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
}});

function bindEventListeners() {
  // $turnCameraOnButton.addEventListener('click', turnOnCamera);
  // $removeBackgroundButton.addEventListener('click', setVirtualBackground);
  // $turnCameraOffButton.addEventListener('click', turnOffCamera);
  const [...$customImages] = $sectionCustomImages.querySelectorAll('.customImage');
  $customImages.map((item, index) => item.addEventListener('click', changeBackground(imageList[index].url)));

  $uploadInput.addEventListener('change', onChangeBackgroundImage);
}

function renderImageItem(imageList) {
  return imageList.reduce(
    (acc, curr) =>
      acc +
      `<div class="customImage">
        <img
          src="${curr.url}"
          alt="${curr.alt}"
          style="width:100px;height:100px"
        />
      </div>`,
    ''
  );
}

(function init() {
  $sectionCustomImages.innerHTML = renderImageItem(imageList);
  bindEventListeners();
})();

selfieSegmentation.setOptions({
  modelSelection: 1,
});

selfieSegmentation.onResults(onResults);

// const $localVideo = document.querySelector('.localVideo');
// const $turnCameraOnButton = document.querySelector('.turnCameraOnButton');
// const $turnCameraOffButton = document.querySelector('.turnCameraOffButton');
// const $removeBackgroundButton = document.querySelector('.removeBackgroundButton');


// 修改背景图片时
function changeBackground(imageUrl) {
  return () => {
    customBackgroundImage.src = imageUrl;
    canvasCtx.drawImage(customBackgroundImage, 0, 0, canvasElement.width, canvasElement.height);
  };
}

// 上传背景图片文件时
function onChangeBackgroundImage(e) {
  const reader = new FileReader();
  reader.readAsDataURL(e.target.files[0]);
  reader.onload = () => {
    changeBackground(reader.result)();
  };
}

// 设置虚拟背景
// async function setVirtualBackground() {
//   const transformedStream = await transformGetUserMediaStream();
//   $localVideo.srcObject = transformedStream;
//   $uploadInput.disabled = false;
// }

// // 转换MediaSteam
// async function transformGetUserMediaStream() {
//   const videoTrack = stream.getVideoTracks()[0];
//   const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
//   const trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });
//   customBackgroundImage.src = imageList[0].url;
//   const { width, height } = videoTrack.getSettings();

//   canvasElement = new OffscreenCanvas(width, height);
//   canvasCtx = canvasElement.getContext('2d');

//   const transformer = new TransformStream({
//     async transform(videoFrame, controller) {
//       globalController = controller;
//       timestamp = videoFrame.timestamp;
//       videoFrame.width = width;
//       videoFrame.height = height;
//       await selfieSegmentation.send({ image: videoFrame });

//       videoFrame.close();
//       console.log('transform');
//     }
//   });

//   trackProcessor.readable.pipeThrough(transformer).pipeTo(trackGenerator.writable);

//   const transformedStream = new MediaStream([trackGenerator]);
//   return transformedStream;
// }


// 获取到摄像头数据，处理后画在canvas上
function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.segmentationMask, 0, 0,canvasElement.width, canvasElement.height);

  canvasCtx.globalCompositeOperation = 'source-out';

  canvasCtx.drawImage(customBackgroundImage, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.globalCompositeOperation = 'destination-atop';
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.restore();

  // 待处理
  // globalController.enqueue(new VideoFrame(canvasElement, { timestamp, alpha: 'discard' }));


  // Only overwrite existing pixels.
  // canvasCtx.globalCompositeOperation = 'source-in';
  // canvasCtx.fillStyle = '#00FF00';
  // canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);

  // // Only overwrite missing pixels.
  // canvasCtx.globalCompositeOperation = 'destination-atop';
  // canvasCtx.drawImage(
  //     results.image, 0, 0, canvasElement.width, canvasElement.height);

  // canvasCtx.restore();
}


const camera = new Camera(videoElement, {
  onFrame: async () => {
    await selfieSegmentation.send({image: videoElement});
  },
  width: 320,
  height: 240
});
camera.start();