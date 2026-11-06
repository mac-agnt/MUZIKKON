import { Fragment } from "react";
import { arr, cat, css, txt } from "../../runtime/template";
import MuzHomeWidgets from "../../muz/HomeWidgets";

type Props = { v: any };

export default function HomeWidgetRail({ v }: Props) {
  return (
    <>
      <aside style={{"position":"relative","zIndex":"1","width":"380px","flex":"none","minHeight":"0","overflowY":"auto","display":"flex","flexDirection":"column","gap":"14px","padding":"2px 0 6px 20px"}}>
        <div style={{"flex":"0 0 auto","minWidth":"0","overflow":"hidden","display":"flex","flexWrap":"nowrap","alignItems":"center","justifyContent":"space-between","gap":"4px","padding":"2px 0 4px","fontFamily":"var(--mono)"}}>
          {arr(v.flipUnits).map((u: any, i15: number) => (
            <Fragment key={i15}>
              <div style={{"display":"flex","flexWrap":"nowrap","alignItems":"center","gap":"3px"}}>
                {arr(u?.tiles).map((t: any, i16: number) => (
                  <Fragment key={i16}>
                    {t?.isColon && (
                      <>
                        <div style={{"display":"flex","flexDirection":"column","gap":"3px","padding":"0 1px"}}>
                          <span style={{"width":"2.5px","height":"2.5px","borderRadius":"2px","background":"var(--accent)","animation":"tickPulse 1s ease-in-out infinite"}} />
                          <span style={{"width":"2.5px","height":"2.5px","borderRadius":"2px","background":"var(--accent)","animation":"tickPulse 1s ease-in-out .1s infinite"}} />
                        </div>
                      </>
                    )}
                    {t?.isTile && (
                      <>
                        <span style={css(cat("position:relative;display:flex;align-items:center;justify-content:center;min-width:", t?.w, ";height:", t?.h, ";padding:0 3px;border-radius:var(--r-sm,9px);background:var(--flap);border:1px solid var(--border);box-shadow:0 3px 8px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.13);font-size:", t?.size, ";font-weight:500;letter-spacing:-0.3px;color:", t?.color, ";overflow:hidden;perspective:100px"))}>
                          <span style={{"position":"absolute","left":"0","right":"0","top":"50%","height":"1px","background":"var(--flap-hinge)","zIndex":"4"}} />
                          {"\n"}
                          {txt(t?.v)}
                          {"\n"}
                          <span style={css(cat("position:absolute;top:0;left:0;right:0;height:50%;overflow:hidden;background:var(--flap);transform-origin:bottom center;backface-visibility:hidden;z-index:3;display:", t?.flapShow, ";animation:", t?.topAnim))}>
                            <span style={{"position":"absolute","top":"0","left":"0","right":"0","height":"200%","display":"flex","alignItems":"center","justifyContent":"center"}}>
                              {txt(t?.prev)}
                            </span>
                          </span>
                          <span style={css(cat("position:absolute;bottom:0;left:0;right:0;height:50%;overflow:hidden;background:var(--flap);transform-origin:top center;backface-visibility:hidden;z-index:3;display:", t?.flapShow, ";animation:", t?.botAnim))}>
                            <span style={{"position":"absolute","bottom":"0","left":"0","right":"0","height":"200%","display":"flex","alignItems":"center","justifyContent":"center"}}>
                              {txt(t?.v)}
                            </span>
                          </span>
                        </span>
                      </>
                    )}
                  </Fragment>
                ))}
              </div>
            </Fragment>
          ))}
        </div>
        <MuzHomeWidgets />
      </aside>
    </>
  );
}
