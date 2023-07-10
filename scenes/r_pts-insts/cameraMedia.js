import { VideoTexture } from 'three';

const $video = document.createElement('video');
document.body.append($video);
Object.assign($video.style, { position: 'absolute', top: '-9999px' };

const videoTexture = new VideoTexture( $video );

if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {
  const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };
  navigator.mediaDevices.getUserMedia( constraints ).then( function ( stream ) {
    $video.srcObject = stream;
    $video.play();
  } ).catch( err => console.error( 'Unable to access the camera/webcam.', err ));

} else {
  console.error( 'MediaDevices interface not available.' );
}

export { $video, videoTexture };