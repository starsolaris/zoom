/**
 *
 * @returns {{init: function, controls: Array, hideMiniMap: function, destroy: function, changeSize: function, showMiniMap: function}}
 * @constructor
 */
function DigitalZoom() {
    return {
        controls: [],

        destroy: function (node) {
            let removeControl = i => {
                this.controls[i].removeHandlers();
                this.controls[i].removeStyle();
                this.controls[i] = null;
                this.controls.splice(i, 1);
            };

            if (typeof node === 'undefined') {
                for (let i = 0; i < this.controls.length; i++) {
                    removeControl(i);
                }
                this.controls = [];
            } else {
                for (let i = 0; i < this.controls.length; i++) {
                    if (this.controls[i].element === node) {
                        removeControl(i);
                        break;
                    }
                }
            }
        },
        /**
         *
         * @param {{node: HTMLElement, onzoomin: function|undefined, onzoomout: function|undefined}} params
         * @returns {boolean}
         */
        init: function (params) {
            if (!params.node) {
                return false;
            }

            let digitalZoom = {
                deltaWidth: 0,
                deltaHeight: 0,

                element: null,
                elementRect: {},

                parentElement: null,
                parentRect: {},

                isMouseDown: false,

                translateX: 0,
                translateY: 0,

                lastTranslateX: 0,
                lastTranslateY: 0,

                clickX: 0,
                clickY: 0,

                zoomStep: 0.1,
                zoomFactor: 1,
                maxZoomFactor: document.querySelector('img').naturalHeight * 2 /
                    (this.parentElement ? this.parentElement.clientHeight : document.querySelector('.container').clientHeight),

                transformOriginX: 0,
                transformOriginY: 0,

                maxTranslateX: 0,
                maxTranslateY: 0,
                minTranslateX: 0,
                minTranslateY: 0,

                bodyEvents: false,

                applyTransform: function () {
                    if (digitalZoom.translateX < digitalZoom.minTranslateX) {
                        digitalZoom.translateX = digitalZoom.minTranslateX;
                    }
                    if (digitalZoom.translateX > digitalZoom.maxTranslateX) {
                        digitalZoom.translateX = digitalZoom.maxTranslateX;
                    }
                    if (digitalZoom.translateY < digitalZoom.minTranslateY) {
                        digitalZoom.translateY = digitalZoom.minTranslateY;
                    }
                    if (digitalZoom.translateY > digitalZoom.maxTranslateY) {
                        digitalZoom.translateY = digitalZoom.maxTranslateY;
                    }

                    digitalZoom.element.style.transformOrigin = '' + digitalZoom.transformOriginX + '% ' + digitalZoom.transformOriginY + '%';
                    digitalZoom.element.style.transform = 'translate(' + digitalZoom.translateX + 'px, ' + digitalZoom.translateY + 'px) scale(' + digitalZoom.zoomFactor + ')';
                    console.log(digitalZoom.zoomFactor);
                },
                removeHandlers: function () {
                    digitalZoom.element.removeEventListener('mousedown', digitalZoom.onMouseDown);
                    digitalZoom.element.removeEventListener('DOMMouseScroll', digitalZoom.onMouseWheel);
                    digitalZoom.element.removeEventListener('mousewheel', digitalZoom.onMouseWheel);
                    digitalZoom.element.removeEventListener('dragstart', digitalZoom.onDragStart);

                    if (digitalZoom.bodyEvents) {
                        document.body.removeEventListener('mousemove', digitalZoom.onMouseMove);
                        document.body.removeEventListener('mouseup', digitalZoom.onMouseLeaveOrUp);
                        document.body.removeEventListener('mouseleave', digitalZoom.onMouseLeaveOrUp);
                    }
                },
                removeStyle: function () {
                    digitalZoom.element.style.removeProperty('transformOrigin');
                    digitalZoom.element.style.removeProperty('transform');
                    digitalZoom.element.style.removeProperty('cursor');
                    digitalZoom.element.style.removeProperty('userSelect');
                    digitalZoom.element.style.removeProperty('-moz-user-select');

                    digitalZoom.parentElement.style.removeProperty('userSelect');
                    digitalZoom.parentElement.style.removeProperty('-moz-user-select');
                },

                //callbacks

                onzoomin: null,
                onzoomout: null,

                //handlers
                onDragStart: function (e) {
                    e.preventDefault();
                },
                onMouseMove: function (e) {
                    if (digitalZoom.zoomFactor !== 1) {
                        digitalZoom.translateX = digitalZoom.lastTranslateX + e.x - digitalZoom.clickX;
                        digitalZoom.translateY = digitalZoom.lastTranslateY + e.y - digitalZoom.clickY;

                        digitalZoom.applyTransform();
                    }
                },
                onMouseLeaveOrUp: function () {
                    document.body.removeEventListener('mousemove', digitalZoom.onMouseMove);
                    document.body.removeEventListener('mouseup', digitalZoom.onMouseLeaveOrUp);
                    document.body.removeEventListener('mouseleave', digitalZoom.onMouseLeaveOrUp);

                    digitalZoom.bodyEvents = false;

                    digitalZoom.lastTranslateX = digitalZoom.translateX;
                    digitalZoom.lastTranslateY = digitalZoom.translateY;
                },
                onMouseDown: function (e) {
                    digitalZoom.clickX = e.x;
                    digitalZoom.clickY = e.y;

                    document.body.addEventListener('mousemove', digitalZoom.onMouseMove);
                    document.body.addEventListener('mouseup', digitalZoom.onMouseLeaveOrUp);
                    document.body.addEventListener('mouseleave', digitalZoom.onMouseLeaveOrUp);

                    digitalZoom.bodyEvents = true;
                },
                onMouseWheel: function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    let step = (e.detail < 0 || e.wheelDelta > 0) ? digitalZoom.zoomStep : -digitalZoom.zoomStep;
                    if (digitalZoom.zoomFactor === 1 && step < 0) {
                        return;
                    }

                    if (typeof digitalZoom.onzoomin === 'function' && digitalZoom.zoomFactor === 1 && step > 0) {
                        console.log('in');
                        digitalZoom.onzoomin();
                    }
                    if (typeof digitalZoom.onzoomout === 'function' && digitalZoom.zoomFactor + step === 1) {
                        digitalZoom.onzoomout();
                    }

                    let tmpZoomFactor = digitalZoom.zoomFactor + step;
                    if (tmpZoomFactor <= digitalZoom.maxZoomFactor) {
                        digitalZoom.zoomFactor += step;
                    } else {
                        digitalZoom.zoomFactor = digitalZoom.maxZoomFactor;
                    }

                    // if (digitalZoom.zoomFactor + step <= digitalZoom.maxZoomFactor) {
                    // digitalZoom.zoomFactor += step;
                    if (digitalZoom.zoomFactor >= 1) {
                        digitalZoom.elementRect = e.target.getBoundingClientRect();

                        digitalZoom.minTranslateX = -((digitalZoom.parentRect.width - digitalZoom.deltaWidth) * digitalZoom.zoomFactor - digitalZoom.parentRect.width);
                        digitalZoom.minTranslateY = -((digitalZoom.parentRect.height - digitalZoom.deltaHeight) * digitalZoom.zoomFactor - digitalZoom.parentRect.height);

                        let x = e.clientX - digitalZoom.elementRect.left;
                        let y = e.clientY - digitalZoom.elementRect.top;

                        digitalZoom.translateX = digitalZoom.parentRect.width / 2 - x;
                        digitalZoom.translateY = digitalZoom.parentRect.height / 2 - y;

                        digitalZoom.lastTranslateX = digitalZoom.translateX;
                        digitalZoom.lastTranslateY = digitalZoom.translateY;

                        digitalZoom.applyTransform();
                    } else {
                        digitalZoom.zoomFactor = 1;

                        digitalZoom.translateX = 0;
                        digitalZoom.translateY = 0;

                        digitalZoom.lastTranslateX = 0;
                        digitalZoom.lastTranslateY = 0;

                        digitalZoom.minTranslateX = 0;
                        digitalZoom.minTranslateY = 0;

                        digitalZoom.applyTransform();
                    }
                    // } else {
                    //     digitalZoom.zoomFactor = digitalZoom.maxZoomFactor;
                    //     if (digitalZoom.zoomFactor >= 1) {
                    //         digitalZoom.elementRect = e.target.getBoundingClientRect();
                    //
                    //         digitalZoom.minTranslateX = -((digitalZoom.parentRect.width - digitalZoom.deltaWidth) * digitalZoom.zoomFactor - digitalZoom.parentRect.width);
                    //         digitalZoom.minTranslateY = -((digitalZoom.parentRect.height - digitalZoom.deltaHeight) * digitalZoom.zoomFactor - digitalZoom.parentRect.height);
                    //
                    //         let x = e.clientX - digitalZoom.elementRect.left;
                    //         let y = e.clientY - digitalZoom.elementRect.top;
                    //
                    //         digitalZoom.translateX = digitalZoom.parentRect.width / 2 - x;
                    //         digitalZoom.translateY = digitalZoom.parentRect.height / 2 - y;
                    //
                    //         digitalZoom.lastTranslateX = digitalZoom.translateX;
                    //         digitalZoom.lastTranslateY = digitalZoom.translateY;
                    //
                    //         digitalZoom.applyTransform();
                    //     } else {
                    //         digitalZoom.zoomFactor = 1;
                    //
                    //         digitalZoom.translateX = 0;
                    //         digitalZoom.translateY = 0;
                    //
                    //         digitalZoom.lastTranslateX = 0;
                    //         digitalZoom.lastTranslateY = 0;
                    //
                    //         digitalZoom.minTranslateX = 0;
                    //         digitalZoom.minTranslateY = 0;
                    //
                    //         digitalZoom.applyTransform();
                    //     }
                    // }
                }
            };

            digitalZoom.element = params.node;
            if (typeof params.onzoomin === 'function') {
                digitalZoom.onzoomin = params.onzoomin;
            }
            if (typeof params.onzoomout === 'function') {
                digitalZoom.onzoomout = params.onzoomout;
            }

            digitalZoom.parentElement = digitalZoom.element.parentElement;
            digitalZoom.elementRect = digitalZoom.element.getBoundingClientRect();
            digitalZoom.parentRect = digitalZoom.parentElement.getBoundingClientRect();
            digitalZoom.deltaWidth = digitalZoom.parentRect.width - digitalZoom.elementRect.width;
            digitalZoom.deltaHeight = digitalZoom.parentRect.height - digitalZoom.elementRect.height;

            digitalZoom.element.addEventListener('mousedown', digitalZoom.onMouseDown);
            digitalZoom.element.addEventListener('DOMMouseScroll', digitalZoom.onMouseWheel);
            digitalZoom.element.addEventListener('mousewheel', digitalZoom.onMouseWheel);
            digitalZoom.element.addEventListener('dragstart', digitalZoom.onDragStart);

            digitalZoom.element.style.cursor = 'move';
            digitalZoom.element.style.userSelect = 'none';
            digitalZoom.element.style['-moz-user-select'] = 'none';

            digitalZoom.parentElement.style.userSelect = 'none';
            digitalZoom.parentElement.style['-moz-user-select'] = 'none';

            this.controls.push(digitalZoom);
        },
        changeSize: function () {
            // TODO: add implementation
        }
        ,
        /**
         * show and draw mini map
         */
        showMiniMap: function () {
            // TODO: add implementation
        }
        ,
        /**
         * hide mini map
         */
        hideMiniMap: function () {
            // TODO: add implementation
        }
    };
}
