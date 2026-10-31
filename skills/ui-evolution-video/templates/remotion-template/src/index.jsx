import React from 'react';
import {AbsoluteFill, cancelRender, Composition, continueRender, delayRender, getInputProps, Img, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {layersAt} from '../scripts/motion.mjs';

function Evolution(scene) {
  const frame = useCurrentFrame();
  const [fontHandle] = React.useState(() => delayRender('Load project fonts'));
  React.useEffect(() => {
    Promise.all((scene.manifest.fonts ?? []).map(async (font) => {
      const face = new FontFace(font.family, `url(${JSON.stringify(staticFile(font.src))})`,
        {weight: font.weight ?? '400', style: font.style ?? 'normal'});
      document.fonts.add(await face.load());
    })).then(() => document.fonts.ready).then(() => continueRender(fontHandle)).catch(cancelRender);
  }, [fontHandle, scene.manifest.fonts]);
  const {layers, background} = layersAt(scene, frame);
  const viewport = scene.states[0].viewport;
  const scale = Math.min(scene.timeline.width / viewport.width, scene.timeline.height / viewport.height);
  return <AbsoluteFill style={{backgroundColor: background}}>
    <div style={{position: 'absolute', width: viewport.width, height: viewport.height,
      left: (scene.timeline.width - viewport.width * scale) / 2,
      top: (scene.timeline.height - viewport.height * scale) / 2, transform: `scale(${scale})`, transformOrigin: 'top left'}}>
      {layers.map((layer) => {
        const style = {...layer.style, position: 'absolute', boxSizing: 'border-box', margin: 0,
          left: layer.rect.x, top: layer.rect.y, width: layer.rect.width, height: layer.rect.height,
          opacity: layer.opacity, zIndex: layer.z};
        return layer.kind === 'image'
          ? <Img key={layer.key} src={staticFile(layer.asset)} style={style}/>
          : <div key={layer.key} style={style}>{layer.kind === 'text' ? layer.text : null}</div>;
      })}
    </div>
  </AbsoluteFill>;
}

function Root() {
  const scene = getInputProps();
  if (!scene.timeline) throw new Error('Use scripts/render.mjs to provide the validated scene.');
  return <Composition id="Evolution" component={Evolution} defaultProps={scene}
    width={scene.timeline.width} height={scene.timeline.height}
    fps={scene.timeline.fps} durationInFrames={scene.timeline.durationInFrames}/>;
}
registerRoot(Root);
