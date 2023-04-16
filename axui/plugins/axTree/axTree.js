/*!
 *Last modified: 2023-03-15 23:23:29
 *名称: axTree.js
 *简介: tree树菜单的js文件
 *用法: new axTree('#id',{参数})
 *版本: v1.0.5
 *演示: https://www.axui.cn/v2.0/ax-tree.php
 *客服: 3217728223@qq.com
 *交流: QQ群952502085
 *作者: AXUI团队
 */
class axTree {
    constructor(targetDom, options) {
        this.targetDom = axIdToDom(targetDom);
        this.options = axExtend({
            insName: '',
            storageName: '',
            toggle: true, 
            collapseAll: true, 
            disabled: [], 
            expanded: [], 
            checked: [], 
            selected: '', 
            oneSelected: true, 
            arrowIcon: ['ax-icon-right', 'ax-icon-right', 'ax-none'], 
            parentIcon: ['ax-icon-folder', 'ax-icon-folder-open'], 
            childIcon: 'ax-icon-file-text', 
            iconShow: false, 
            checkboxIcon: ['ax-icon-square', 'ax-icon-check-s', 'ax-icon-check-s-f'], 
            radioIcon: ['ax-icon-circle', 'ax-icon-radio', 'ax-icon-radio-f'], 
            checkShow: false, 
            checkType: 'checkbox', 
            checkMin: 0, 
            checkMax: 1000000, 
            linkage: true, 
            oneRadio: false, 
            readonly: '', 
            url: '', 
            inputWidth: '', 
            toolsShow: false, 
            toolsAction: 'hover', 
            addTools: [], 
            firstFloor: -1, 
            idStart: 0,
            draggable: false, 
            line: false, 
            async: '', 
            ajaxType: 'post', 
            delay: 0, 
            fields: '', 
            content: '', 
            onBeforeRemove: '',
            onGetCheckeds: '', 
            onInit: '',
            onCollapse: '',
            onExpand: '',
            onCollapsed: '',
            onExpanded: '',
            onCollapseAll: '',
            onExpandAll: '',
            onSetReadonly: '',
            onSetDisabled: '',
            onSetChecked: '',
            onSearched: '',
            onRemoved: '',
            onEditing: '',
            onEdited: '',
            onAdded: '',
            onSelected: '',
            onPlanted: '',
            onClickCheck: '',
            onDropped: '',
            onTooMuch: '',
            onTooLittle: '',
            onDestroy: '',
            onSave: '',
            onUpdate: '',
            onUpdateContent: '',
        }, options, this.targetDom, this.constructor.name);
        this.handlers = {};
        this.checked = [];
        this.checkeds = [];
        this.expanded = [];
        this.expandeds = [];
        this.selected = this.options.selected;
        if (this.options.oneSelected && !axIsEmpty(this.selected)) {
            this.selected.shift();
        }
        this.selecteds = [];
        this.disabled = this.options.disabled;
        this.disableds = [];
        this.searchs = [];
        this.readonlys = [];
        this.arrowSame = this.options.arrowIcon[0] == this.options.arrowIcon[1] ? true : false;
        this.arrow = axAddElem('i', { class: 'ax-iconfont', arrow: '' });
        this.checkIcon = {
            checkbox: [
                '<i class="ax-iconfont ' + this.options.checkboxIcon[0] + '" check></i>',
                '<i class="ax-iconfont ' + this.options.checkboxIcon[1] + '" check></i>',
                '<i class="ax-iconfont ' + this.options.checkboxIcon[2] + '" check></i>'
            ],
            radio: [
                '<i class="ax-iconfont ' + this.options.radioIcon[0] + '" check></i>',
                '<i class="ax-iconfont ' + this.options.radioIcon[1] + '" check></i>',
                '<i class="ax-iconfont ' + this.options.radioIcon[2] + '" check></i>'
            ],
        };
        this.fileIcon = '';
        if (this.options.iconShow) {
            this.fileIcon = {
                parent: '<i class="ax-iconfont ' + this.options.parentIcon[0] + '" legend></i>',
                child: '<i class="ax-iconfont ' + this.options.childIcon + '" legend></i>'
            }
        }
        this.maxFloor = 0;
        this.rawHTML = '';
        this.init();
    }
    init() {
        axInstance.push(this, this.options.insName, 'tree');
        this.destroyed = false;
        this.flatData = [];
        this.treeData = [];
        if (this.options.storageName) {
            let storageVal = axLocalStorage.get(this.options.storageName);
            if (!axIsEmpty(storageVal)) {
                this.options = axExtend(this.options, storageVal);
            } else {
                axLocalStorage.set(this.options.storageName, {});
            }
        }
        let _this = this;
        if (axType(this.options.content) == 'String' && this.options.async) {
            if (this.options.async == 'json') {
                this.contentXhr = axAjax({
                    url: this.options.content,
                    type: this.options.ajaxType,
                    success: function (content) {
                        if (axIsEmpty(content)) {
                            console.warn('No data obtained from json!');
                            return false;
                        }
                        _this.toTree(content);
                        _this.dataProcess(_this.treeData);
                    }
                }, this.targetDom);
            } else if (this.options.async == 'sql') {
                this.contentXhr = axAjax({
                    data: { pId: _this.options.firstFloor },
                    type: this.options.ajaxType,
                    url: this.options.content,
                    success: function (content) {
                        if (axIsEmpty(content)) {
                            console.warn('No data obtained from the database!');
                            return false;
                        }
                        _this.toTree(content);
                        _this.dataProcess(_this.treeData);
                    }
                }, this.targetDom);
            }
        } else {
            if (axType(this.options.content) == 'Array') {
                if (this.options.content.length === 0) {
                    console.warn('Array is empty!');
                    return false;
                }
                this.toTree(this.options.content);
            } else if (axType(this.options.content).includes('HTML') || axStrType(this.options.content)) {
                this.treeData = axUlToArr(this.options.content, this.options.idStart, true);
            } else if (this.targetDom.innerHTML) {
                this.treeData = axUlToArr(this.targetDom, this.options.idStart, true);
                this.rawHTML = this.targetDom.innerHTML;
            }
            this.dataProcess(this.treeData);
        }
    }
    toTree(data) {
        if (data[0].hasOwnProperty('pId')) {
            this.treeData = axArrToTree(data, this.options.firstFloor);
        } else {
            this.treeData = data;
        }
    }
    dataProcess(data) {
        let _this = this;
        this.flatData = axArrToFlat(data);
        this.targetDom.innerHTML = '';
        this.setAttribute();
        if (!this.fixChecked(this.flatData)) {
            return false;
        }
        this.refreshTree(data);
        this.fixExpand(this.flatData)
        this.arrayToDom(data);
        this.flatData.forEach((item) => {
            if (axIsEmpty(this.expanded) && !this.options.collapseAll && item.children) {
                item.expanded = false;
                this.ulToggle(item);
            }
            this.renderFinish(item, _this.flatData);
        });
        this.options.onInit && this.options.onInit.call(this);
        'init' in this.handlers ? this.emit('init', '') : null;
    }
    setAttribute() {
        if (this.options.line) {
            this.targetDom.setAttribute('line', '');
        }
    }
    dragPlace(e, node) {
        let topOffset = node.getBoundingClientRect().top,
            bottomOffset = node.getBoundingClientRect().bottom,
            oneThird = ((node.getBoundingClientRect().bottom - node.getBoundingClientRect().top) / 3),
            upOffset = topOffset + ~~oneThird,
            downOffset = bottomOffset - ~~oneThird,
            placement = 'child';
        if (e.clientY < upOffset) {
            placement = 'up';
        } else if (e.clientY > downOffset) {
            placement = 'down';
        }
        return placement;
    }
    resetRelation(item, parent, oldParent, moveTo) {
        let setValue = (obj, target) => {
            if (moveTo == '1-0') {
                obj.pId = this.options.firstFloor;
                obj.path = this.options.firstFloor + '>' + obj.id;
                obj.floor = 1;
                obj.indentDom.innerHTML = '';
            } else if (moveTo == '0-1' || moveTo == 'other' || !moveTo) {
                obj.pId = target.id;
                obj.path = target.path + '>' + obj.id;
                obj.floor = target.floor + 1;
                obj.indentDom.innerHTML = '<i></i>'.repeat(obj.floor - 1);
            } else {
            }
        }
        let eachTraverse = (obj, target) => {
            if (obj.children && obj.children.length > 0) {
                obj.children.forEach(i => {
                    setValue(i, obj);
                    eachTraverse(i, obj);
                });
            } else {
                setValue(obj, target);
            }
        };
        setValue(item, parent);
        eachTraverse(item, parent);
        if (moveTo == '0-1') {
            this.treeData = this.treeData.filter(i => i.id != item.id);
        } else if (moveTo == '0-0') {
        } else if (moveTo == '1-0') {
        } else {
            oldParent.children = oldParent.children.filter(i => i.id != item.id);
        }
    }
    openParentBorn(item, insert, oldParent, moveTo) {
        let ul = item.headerDom.nextElementSibling;
        if (insert) {
            let insertLi = insert.headerDom.parentElement;
            this.resetRelation(insert, item, oldParent, moveTo);
            if (!item.expanded) {
                item.headerDom.setAttribute('expanded', 'true');
                item.expanded = true;
                ul.style.display = 'block';
            }
            item.children.unshift(insert);
            ul.insertAdjacentElement('afterBegin', insertLi);
        }
    }
    childToParentBorn(item, insert, oldParent, moveTo) {
        let _this = this;
        if (item.children) {
            return false;
        } else {
            let ul = axAddElem('ul', { style: 'display:block' });
            item.arrowDom.classList.remove(this.options.arrowIcon[2]);
            item.arrowDom.classList.add(this.options.arrowIcon[0]);
            item.headerDom.setAttribute('expanded', 'true');
            item.expanded = true;
            item.children = [];
            if (insert) {
                let insertLi = insert.headerDom.parentElement;
                this.resetRelation(insert, item, oldParent, moveTo);
                item.children.unshift(insert);
                ul.insertAdjacentElement('afterBegin', insertLi);
            }
            item.headerDom.insertAdjacentElement('afterEnd', ul);
            item.arrowDom.onclick = function () {
                _this.ulToggle(item);
            }
        }
    }
    dropItem(item, insert, oldParent, placement, moveTo) {
        let _this = this,
            insertDom = insert.headerDom,
            insertLi = insertDom.parentElement,
            itemParent = this.flatData.filter(i => item.pId == i.id.toString())[0],
            itemLi = item.headerDom.parentElement,
            insertPlace = (placement == 'up') ? 'beforeBegin' : (placement == 'down') ? 'afterEnd' : '',
            newNode = (place) => {
                this.resetRelation(insert, itemParent, oldParent, moveTo);
                if (moveTo == '0-0') {
                    let insertIndex = this.treeData.indexOf(insert),
                        itemIndex = this.treeData.indexOf(item);
                    if (place == 'up') {
                        axMoveArr(this.treeData, insertIndex, itemIndex);
                    } else if (place == 'down') {
                        axMoveArr(this.treeData, insertIndex, itemIndex + 1);
                    }
                } else if (moveTo == '1-0') {
                    let itemIndex = this.treeData.indexOf(item),
                        index;
                    if (place == 'up') {
                        index = itemIndex;
                    } else if (place == 'down') {
                        index = itemIndex + 1;
                    }
                    this.treeData.splice(index, 0, insert);
                } else {
                    let itemIndex = itemParent.children.indexOf(item),
                        index;
                    if (place == 'up') {
                        index = itemIndex;
                    } else if (place == 'down') {
                        index = itemIndex + 1;
                    }
                    itemParent.children.splice(index, 0, insert);
                }
                itemLi.insertAdjacentElement(insertPlace, insertLi);
            };
        if (placement == 'up') {
            if (itemLi.previousElementSibling == insertLi) {
                return false;
            }
            newNode('up');
        } else if (placement == 'down') {
            if (itemLi.nextElementSibling == insertLi) {
                return false;
            }
            newNode('down');
        } else {
            if (item.children) {
                this.openParentBorn(item, insert, oldParent, moveTo);
            } else {
                this.childToParentBorn(item, insert, oldParent, moveTo);
            }
        }
        insertDom.setAttribute('tabindex', '-1');
        insertDom.focus();
        insertDom.onblur = function () {
            insertDom.removeAttribute('tabindex');
        }
        this.options.onDropped && this.options.onDropped.call(this, insert, item);
        'dropped' in this.handlers ? this.emit('dropped', insert, item) : null;
    }
    ulToggle(obj, linkage = true) {
        let _this = this,
            wrapper = obj.headerDom,
            arrow = obj.arrowDom,
            legend = obj.legendDom,
            ul = wrapper.nextElementSibling;
        if (obj.expanded == true) {
            this.options.onCollapse && this.options.onCollapse.call(this, obj);
            'collapse' in this.handlers ? this.emit('collapse', obj) : null;
            obj.expanded = false;
            wrapper.removeAttribute('expanded');
            if (!this.arrowSame) {
                arrow.classList.remove(this.options.arrowIcon[1]);
                arrow.classList.add(this.options.arrowIcon[0]);
            }
            if (this.options.iconShow) {
                legend.classList.remove(this.options.parentIcon[1]);
                legend.classList.add(this.options.parentIcon[0]);
            }
            this.eachExapand(obj);
            axSlideUp(ul, () => {
                this.options.onCollapsed && this.options.onCollapsed.call(this, obj);
                'collapsed' in this.handlers ? this.emit('collapsed', obj) : null;
            });
        } else {
            this.options.onExpand && this.options.onExpand.call(this, obj);
            'expand' in this.handlers ? this.emit('expand', obj) : null;
            obj.expanded = true;
            wrapper.setAttribute('expanded', 'true');
            if (!this.arrowSame) {
                arrow.classList.remove(this.options.arrowIcon[0]);
                arrow.classList.add(this.options.arrowIcon[1]);
            }
            if (this.options.iconShow) {
                legend.classList.remove(this.options.parentIcon[0]);
                legend.classList.add(this.options.parentIcon[1]);
            }
            this.eachExapand(obj);
            axSlideDown(ul, () => {
                this.options.onExpanded && this.options.onExpanded.call(this, obj);
                'expanded' in this.handlers ? this.emit('expanded', obj) : null;
            });
            if (linkage) {
                this.siblingsCollapse(this.flatData, obj);
            }
        }
        this.save();
    };
    clickCheck(item, data) {
        let _this = this;
        item.checkDom.onclick = function () {
            if (!item.checkDom || item.disabled) {
                return false;
            }
            if (_this.checkeds.length > _this.options.checkMax && !item.checked) {
                console.warn('The length of checked is too much!');
                _this.options.onTooMuch && _this.options.onTooMuch.call(_this, _this.checkeds.length, _this.options.checkMax);
                'tooMuch' in _this.handlers ? _this.emit('tooMuch', _this.checkeds.length, _this.options.checkMax) : null;
                return false;
            }
            if (_this.options.checkType == 'checkbox') {
                if (item.checked == true) {
                    item.checked = false;
                } else {
                    item.checked = true;
                }
                _this.eachCheckbox(item, _this.options.linkage);
                _this.options.onGetCheckeds && _this.options.onGetCheckeds.call(_this, _this.checkeds, item);
            } else if (_this.options.checkType == 'radio') {
                let brothers = data.filter(i => i.pId == item.pId);
                if (brothers.some(i => i.checked == true && i.disabled == true)) {
                    console.warn('You must uncheck the disabled item that have been checked!');
                    return false;
                }
                if (_this.options.oneRadio && data.some(i => i.checked == true && i.disabled == true)) {
                    console.warn('You must uncheck the disabled item that have been checked!');
                    return false;
                }
                if (item.checked == true) {
                    item.checked = false;
                } else {
                    item.checked = true;
                }
                _this.eachRadio(item, _this.options.linkage);
                _this.options.onGetCheckeds && _this.options.onGetCheckeds.call(_this, _this.checkeds, item);
            }
            _this.options.onClickCheck && _this.options.onClickCheck.call(_this, _this.checkeds, item);
            'clickCheck' in _this.handlers ? _this.emit('clickCheck', _this.checkeds, item) : null;
        }
    }
    siblingsCollapse(data, item) {
        if (this.options.toggle) {
            let siblings = data.filter(i => i.pId == item.pId && i.children && i != item);
            for (let i = 0, len = siblings.length; i < len; i++) {
                let k = siblings[i];
                if (!k.headerDom.nextElementSibling) {
                    continue;
                } else {
                    k.expanded = true;
                    this.ulToggle(k);
                }
            }
        }
    }
    renderFinish(item, data) {
        let _this = this,
            parent = item.headerDom.parentElement;
        if (!item.arrowDom.classList.contains(this.options.arrowIcon[2])) {
            item.arrowDom.onclick = function () {
                if (!item.expanded && _this.options.async == 'sql') {
                    let ul = item.headerDom.nextElementSibling;
                    if (!ul) {
                        ul = axAddElem('ul');
                        item.headerDom.insertAdjacentElement("afterEnd", ul);
                    }
                    if (!ul.querySelector('li')) {
                        axAjax({
                            data: { pId: item.id },
                            type: _this.options.ajaxType,
                            url: _this.options.content,
                            before: function () {
                                item.arrowDom.setAttribute('loading', '');
                            },
                            success: function (content) {
                                item.arrowDom.removeAttribute('loading');
                                ul.innerHTML = '';
                                content.forEach(i => {
                                    _this.add(i, item, true, false);
                                });
                            }
                        });
                    }
                }
                _this.ulToggle(item);
            }
        }
        if (this.selected.includes(item.id)) {
            item.selected = true;
            this.eachSelect(item);
        }
        if (this.options.checkShow) {
            if (this.disabled.includes(item.id)) {
                item.disabled = true;
                this.eachDisabled(item);
            }
            if (this.checked.includes(item.id)) {
                item.checked = true;
                if (this.options.checkType == 'checkbox') {
                    this.eachCheckbox(item, this.options.linkage);
                } else if (this.options.checkType == 'radio') {
                    this.eachRadio(item, this.options.linkage);
                }
            }
            this.clickCheck(item, data);
        }
        if (this.options.toolsShow) {
            item.removeDom.onclick = function () {
                if (item.readonly) {
                    return false;
                }
                if (_this.options.onBeforeRemove) {
                    let flag = _this.options.onBeforeRemove.call(_this, item, item.removeDom);
                    if (flag) {
                        _this.remove(item);
                    }
                } else {
                    _this.remove(item);
                }
            }
            item.editDom.onclick = function () {
                if (item.readonly) {
                    return false;
                }
                _this.edit(item);
            }
            item.addDom.onclick = function () {
                if (item.readonly) {
                    return false;
                }
                _this.add('', item);
            }
        }
        if (item.labelDom) {
            item.labelDom.onclick = function () {
                if (item.headerDom.hasAttribute('editing')) {
                    return false;
                }
                let branches = data.filter(i => i != item);
                if (item.selected == true) {
                    item.selected = false;
                    _this.eachSelect(item);
                } else {
                    item.selected = true;
                    _this.eachSelect(item);
                    if (_this.options.oneSelected) {
                        branches.forEach(i => {
                            if (i.selected == true) {
                                i.selected = false;
                                _this.eachSelect(i);
                            }
                        });
                    }
                    _this.options.onSelected && _this.options.onSelected.call(_this, item);
                    'selected' in _this.handlers ? _this.emit('selected', item) : null;
                }
                if (item.toolsDom && _this.options.toolsAction == 'click') {
                    if (item.selected) {
                        item.toolsDom.style.display = 'inline-block';
                    } else {
                        item.toolsDom.style.display = 'none';
                    }
                }
            }
            item.labelDom.ondblclick = function () {
                if (item.readonly) {
                    return false;
                }
                _this.edit(item);
            }
        }
        /*拖拽节点*/
        if (this.options.draggable == true) {
            parent.setAttribute('draggable', 'true');
            parent.addEventListener('dragstart', function (e) {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData("id", item.id);
            }, false);
        } else if (axType(this.options.draggable) == 'Array') {
            if (this.options.draggable.includes(item.id)) {
                parent.setAttribute('draggable', 'true');
                parent.addEventListener('dragstart', function (e) {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData("id", item.id);
                }, false)
            }
        }
        item.headerDom.addEventListener('dragenter', function (e) {
            e.preventDefault();
        }, false);
        item.headerDom.addEventListener('dragover', function (e) {
            e.preventDefault();
            parent.classList.add('ax-dragging');
            parent.setAttribute('insert', _this.dragPlace(e, item.headerDom));
        }, false);
        item.headerDom.addEventListener('dragleave', function (e) {
            e.preventDefault();
            parent.classList.remove('ax-dragging');
            parent.removeAttribute('insert');
        }, false);
        item.headerDom.addEventListener('drop', function (e) {
            e.preventDefault();
            let data = e.dataTransfer.getData('id'),
                tranItem = _this.flatData.filter(i => data == i.id.toString())[0],
                tranParent = _this.flatData.filter(i => tranItem.pId == i.id)[0],
                moveDirection;
            if (item.pId == tranItem.pId && item.pId == _this.options.firstFloor && _this.dragPlace(e, item.headerDom) != 'child') {
                moveDirection = '0-0'
            } else if (item.pId == _this.options.firstFloor && _this.dragPlace(e, item.headerDom) != 'child') {
                moveDirection = '1-0'
            } else if (tranItem.pId == _this.options.firstFloor) {
                moveDirection = '0-1'
            } else {
                moveDirection = 'other';
            }
            parent.classList.remove('ax-dragging');
            parent.removeAttribute('insert');
            if (item == tranItem) {
                return false;
            }
            _this.dropItem(item, tranItem, tranParent, _this.dragPlace(e, item.headerDom), moveDirection);
        }, false);
        this.save();
    }
    getParents(idArr, mode = 'obj') {
        let parentsId = [],
            parentsObj = [];
        if (axType(idArr) == 'Array') {
            let items = this.flatData.filter(i => idArr.includes(i.id));
            items.forEach(i => {
                let paths = i.path.split('>').filter(k => k.id != this.options.firstFloor && k != i.id);
                parentsId.push(...paths);
            });
        } else if (axType(idArr) == 'Object') {
            let paths = idArr.path.split('>').filter(k => k.id != this.options.firstFloor && k != idArr.id);
            parentsId.push(...paths);
        } else {
            let item = this.flatData.filter(i => i.id == idArr)[0],
                paths = item.path.split('>').filter(k => k.id != this.options.firstFloor && k != item.id);
            parentsId.push(...paths);
        }
        parentsId = [...parentsId].filter((i, index) => [...parentsId].indexOf(i) == index);
        parentsId = parentsId.map(Number);
        parentsObj = this.flatData.filter(i => parentsId.includes(i.id));
        if (mode == 'obj') {
            return parentsObj;
        } else if (mode == 'id') {
            return parentsId;
        } else {
            return { obj: parentsObj, id: parentsId }
        }
    }
    getChildren(idArr) {
        let childrenObj = [];
        if (axType(idArr) == 'Array') {
            idArr.forEach(i => {
                let children = this.flatData.filter(k => k.path.includes('>' + i + '>'));
                childrenObj.push(...children);
            });
        } else if (axType(idArr) == 'Object') {
            childrenObj = this.flatData.filter(k => k.path.includes('>' + idArr.id + '>'));
        } else {
            childrenObj = this.flatData.filter(k => k.path.includes('>' + idArr + '>'));
        }
        return childrenObj;
    }
    eachSelect(item) {
        if (item.selected == true) {
            item.headerDom.setAttribute('selected', 'true');
            !this.selecteds.includes(item.id) ? this.selecteds.push(item.id) : null;
        } else {
            item.headerDom.removeAttribute('selected');
            for (let i = 0; i < this.selecteds.length; i++) {
                if (this.selecteds[i] == item.id) {
                    this.selecteds.splice(i, 1);
                    break;
                }
            }
        }
    }
    eachDisabled(item) {
        let flagToggle = (k, flag) => {
            if (flag) {
                k.headerDom.setAttribute('disabled', 'true');
                !this.disableds.includes(k.id) ? this.disableds.push(k.id) : null;
            } else {
                k.headerDom.removeAttribute('disabled');
                for (let i = 0; i < this.disableds.length; i++) {
                    if (this.disableds[i] == k.id) {
                        this.disableds.splice(i, 1);
                        break;
                    }
                }
            }
        }
        let childChecked = (k, flag) => {
            k.disabled = flag;
            flagToggle(k, flag);
            if (k.children && k.children.length > 0) {
                let children = [...k.children].filter(i => !i.disabled);
                children.forEach(i => {
                    childChecked(i, flag);
                });
            }
        }
        if (item.disabled == true) {
            flagToggle(item, true);
            if (this.options.checkType == 'checkbox') {
                childChecked(item, true);
            }
        } else {
            flagToggle(item, false);
            if (this.options.checkType == 'checkbox') {
                childChecked(item, false);
            }
        }
    }
    eachExapand(item) {
        if (item.expanded == true) {
            item.headerDom.setAttribute('expanded', 'true');
            !this.expandeds.includes(item.id) ? this.expandeds.push(item.id) : null;
        } else {
            item.headerDom.removeAttribute('expanded');
            for (let i = 0; i < this.expandeds.length; i++) {
                if (this.expandeds[i] == item.id) {
                    this.expandeds.splice(i, 1);
                    break;
                }
            }
        }
    }
    checkToggle(obj, flag, type) {
        let itemDom = obj.headerDom,
            checkDom = itemDom.querySelector('[check]'),
            icon = type == 'checkbox' ? 'checkboxIcon' : type == 'radio' ? 'radioIcon' : '';
        if (flag == true) {
            obj.checked = true;
            itemDom.setAttribute('checked', 'true');
            checkDom.classList.remove(this.options[icon][0], this.options[icon][1]);
            checkDom.classList.add(this.options[icon][2]);
        } else if (flag == false) {
            obj.checked = false;
            itemDom.setAttribute('checked', 'false');
            checkDom.classList.remove(this.options[icon][1], this.options[icon][2]);
            checkDom.classList.add(this.options[icon][0]);
        } else if (flag == 'ing') {
            obj.checked = 'ing';
            itemDom.setAttribute('checked', 'ing');
            checkDom.classList.remove(this.options[icon][0], this.options[icon][2]);
            checkDom.classList.add(this.options[icon][1]);
        }
    }
    eachCheckbox(item, linkage) {
        let _this = this;
        if (linkage) {
            let floatDown = (obj) => {
                let isParent = obj.children;
                if (isParent) {
                    if (obj.checked == true) {
                        this.checkToggle(obj, true, 'checkbox');
                        obj.children.forEach(i => {
                            if (!i.disabled) {
                                i.checked = true;
                                floatDown(i);
                            }
                        })
                    } else if (!obj.checked) {
                        this.checkToggle(obj, false, 'checkbox');
                        obj.children.forEach(i => {
                            if (!i.disabled) {
                                i.checked = false;
                                floatDown(i);
                            }
                        })
                    }
                } else {
                    if (obj.checked == true) {
                        this.checkToggle(obj, true, 'checkbox');
                    } else if (!obj.checked) {
                        this.checkToggle(obj, false, 'checkbox');
                    }
                }
            },
                floatUp = (obj) => {
                    let parentArr = obj.path.split('>').filter(i => i !== this.options.firstFloor && i != obj.id),
                        parents = this.flatData.filter(i => parentArr.includes(i.id.toString())).reverse();
                    parents.forEach(i => {
                        if (i.children.filter(k => !k.disabled).every(k => !k.checked)) {
                            this.checkToggle(i, false, 'checkbox');
                        } else if (i.children.filter(k => !k.disabled).every(k => k.checked == true)) {
                            this.checkToggle(i, true, 'checkbox');
                        } else if (i.children.some(k => k.checked == true || k.checked == 'ing')) {
                            this.checkToggle(i, 'ing', 'checkbox');
                        }
                    });
                };
            floatDown(item);
            floatUp(item);
        } else {
            if (item.checked == true) {
                this.checkToggle(item, true, 'checkbox');
            } else if (!item.checked) {
                this.checkToggle(item, false, 'checkbox');
            } else {
                this.checkToggle(item, 'ing', 'checkbox');
            }
        }
        this.checkeds = [];
        let checkedItems = this.flatData.filter(i => i.checked == true);
        checkedItems.forEach(i => {
            this.checkeds.push(i.id);
        });
        if (this.checkeds.length > this.options.checkMax) {
            console.warn('The length of checked is too much!');
            this.options.onTooMuch && this.options.onTooMuch.call(this, this.checkeds.length, this.options.checkMax);
            'tooMuch' in this.handlers ? this.emit('tooMuch', this.checkeds.length, this.options.checkMax) : null;
        } else if (this.checkeds.length < this.options.checkMin) {
            console.warn('The length of checked is too little!');
            this.options.onTooLittle && this.options.onTooLittle.call(this, this.checkeds.length, this.options.checkMin);
            'tooLittle' in this.handlers ? this.emit('tooLittle', this.checkeds.length, this.options.checkMin) : null;
        }
    }
    eachRadio(item, linkage) {
        if (item.checked == true) {
            let hasRadio = [];
            if (this.options.oneRadio) {
                hasRadio = this.flatData.filter(i => i.checked == true && i != item);
            } else {
                hasRadio = this.flatData.filter(i => i.pId == item.pId && i.checked == true && i != item);
            };
            hasRadio.forEach(i => {
                this.checkToggle(i, false, 'radio');
            });
            this.checkToggle(item, true, 'radio');
        } else {
            this.checkToggle(item, false, 'radio');
        }
        if (linkage) {
            let traverse = () => {
                let checkeds = this.flatData.filter(i => i.checked == true),
                    parentArr = [];
                checkeds.forEach(i => {
                    let paths = i.path.split('>').filter(k => k !== this.options.firstFloor && k != i.id);
                    parentArr.push(...paths);
                });
                parentArr = [...parentArr].filter(function (i, index) {
                    return [...parentArr].indexOf(i) == index;
                });
                let ingParents = this.flatData.filter(i => parentArr.includes(i.id.toString())),
                    allParents = this.flatData.filter(i => i.children && i != item && !i.checked);
                allParents.forEach(i => {
                    if (i.checked) {
                        this.checkToggle(i, false, 'radio');
                    }
                });
                if (!axIsEmpty(ingParents)) {
                    ingParents.forEach(i => {
                        if (i.checked == true) {
                            this.checkToggle(i, true, 'radio');
                        } else {
                            this.checkToggle(i, 'ing', 'radio');
                        }
                    });
                }
            };
            traverse();
        }
        this.checkeds = [];
        let checkedItems = this.flatData.filter(i => i.checked == true);
        checkedItems.forEach(i => {
            this.checkeds.push(i.id);
        });
    }
    arrange(data) {
        let newArr = [];
        data.forEach((item, index) => {
            let rest = data.slice(index + 1, data.length);
            rest.forEach(i => {
                let itemArr = [];
                itemArr = [item, i];
                newArr.push(itemArr);
            })
        });
        return newArr;
    }
    fixChecked(data) {
        let flag = true;
        if (this.options.checked.length > this.checkMax) {
            console.warn('The length of checked has been automatically intercepted!');
            this.options.onTooMuch && this.options.onTooMuch.call(this, this.options.checked.length, this.checkMax);
            'tooMuch' in this.handlers ? this.emit('tooMuch', this.options.checked.length, this.checkMax) : null;
            this.checked = this.options.checked.splice(this.checkMax)
        } else {
            this.checked = this.options.checked;
        }
        if (this.checked.length < this.checkMin) {
            console.error('The length of checked has exceeded the limit!');
            this.options.onTooLittle && this.options.onTooLittle.call(this, this.checked.length, this.checkMin);
            'tooLittle' in this.handlers ? this.emit('tooLittle', this.checked.length, this.checkMin) : null;
            flag = false;
        }
        if (this.options.checkType == 'radio' && this.checked.length > 1) {
            flag = !this.arrange(this.checked).some(item => {
                return data.find(i => i.id == item[0]).pId == data.find(i => i.id == item[1]).pId
            });
            if (!flag) {
                console.error('Only one item can be selected at the same level!');
            }
        } else if (this.options.checkType == 'checkbox') {
        }
        return flag;
    }
    fixExpand(data) {
        let newArr = []
        data.forEach(item => {
            let arr = item.path.split('>').filter(i => i !== this.options.firstFloor);
            if (this.options.expanded.includes(~~arr[arr.length - 1])) {
                newArr.push(...arr);
            }
            if (item.children && item.children.length > 0) {
                let childObj = [];
                item.children.forEach(i => {
                    childObj.push(i.id);
                });
                if (this.options.linkage) {
                    if (childObj.every(k => this.checked.includes(k))) {
                        item.checked = true;
                    } else if (childObj.some(k => this.checked.includes(k))) {
                        item.checked = 'ing';
                    }
                }
            }
        });
        this.expanded = newArr.filter(function (item, index) {
            return newArr.indexOf(item) == index;
        });
        this.expanded.forEach(item => {
            let find = data.find(i => item == i.id && i.children);
            find ? find.expanded = true : null;
        });
    }
    createItem(obj, floor) {
        let _this = this,
            check = '',
            tools = `<span tools><i class="ax-iconfont ax-icon-plus" add></i><i class="ax-iconfont ax-icon-edit" edit></i><i class="ax-iconfont ax-icon-trash" remove></i></span>`;
        if (_this.options.checkType == 'checkbox' && _this.options.checkShow) {
            if (obj.hasOwnProperty('checked')) {
                if (obj.checked == true) {
                    check = _this.checkIcon.checkbox[2];
                } else if (obj.checked == 'ing') {
                    check = _this.checkIcon.checkbox[1];
                }
            } else {
                check = _this.checkIcon.checkbox[0];
            }
        } else if (_this.options.checkType == 'radio' && _this.options.checkShow) {
            if (obj.hasOwnProperty('checked')) {
                if (obj.checked == true) {
                    check = _this.checkIcon.radio[2];
                } else if (obj.checked == 'ing') {
                    check = _this.checkIcon.radio[1];
                }
            } else {
                check = _this.checkIcon.radio[0];
            }
        }
        let arrow = `<i class="${!_this.arrowSame ? 'ax-different' : ''} ax-iconfont ${obj.children ? this.options.arrowIcon[0] : this.options.arrowIcon[2]}" arrow></i>`,
            nodeTpl = `
                        <div class="ax-node" >
                            <span indent>${'<i></i>'.repeat(floor - 1)}</span>
                            ${arrow}
                            ${check}
                            <# if(this.children){ #>${_this.fileIcon ? _this.fileIcon.parent : ''}<# } else { #>${_this.fileIcon ? _this.fileIcon.child : ''} <# } #>
                            <i label><# this.label #></i>
                            ${_this.options.toolsShow ? tools : ''}
                        </div>`;
        obj.headerDom = axStrToDom(axTplEngine(nodeTpl, obj));
        obj.toolsDom = obj.headerDom.querySelector('[tools]');
        obj.indentDom = obj.headerDom.querySelector('[indent]');
        obj.arrowDom = obj.headerDom.querySelector('[arrow]');
        obj.labelDom = obj.headerDom.querySelector('[label]');
        obj.legendDom = obj.headerDom.querySelector('[legend]');
        obj.checkDom = obj.headerDom.querySelector('[check]');
        obj.otherTools = [];
        if (!axIsEmpty(this.options.addTools)) {
            this.options.addTools.forEach(i => {
                let toolObj = { dom: axStrToDom(i.dom), callback: i.callback };
                obj.otherTools.push(toolObj);
                toolObj.dom.onclick = function () {
                    toolObj.callback.call(_this, obj);
                }
                obj.toolsDom.insertAdjacentElement('afterBegin', toolObj.dom);
            })
        }
        obj.addDom = obj.headerDom.querySelector('[add]');
        obj.editDom = obj.headerDom.querySelector('[edit]');
        obj.removeDom = obj.headerDom.querySelector('[remove]');
        obj.callback && obj.callback.call(this, obj);
        return obj.headerDom;
    }
    addAttritue(obj, div) {
        div.setAttribute('mark', obj.id);
        if (this.options.readonly.includes(obj.id)) {
            this.readonly(obj);
        }
        this.eachExapand(obj);
        this.options.toolsShow ? div.setAttribute('toolsAction', this.options.toolsAction) : null;
    }
    refreshTree(data) {
        this.maxFloor = axTreeMethod.addPath(data, this.options.firstFloor).maxFloor;
        this.flatData = axArrToFlat(this.treeData);
        return data;
    }
    arrayToDom(data) {
        let _this = this,
            outer = axAddElem('ul'),
            fragment = document.createDocumentFragment();
        let plantTree = (parent, data) => {
            let ul = axAddElem('ul');
            data.forEach(item => {
                item.headerDom = this.createItem(item, item.floor);
                item.wrapperDom = axAddElem('li');
                this.addAttritue(item, item.headerDom);
                item.wrapperDom.appendChild(item.headerDom);
                if (item.hasOwnProperty('children')) {
                    plantTree(item.wrapperDom, item.children);
                }
                ul.appendChild(item.wrapperDom);
            });
            parent.appendChild(ul);
            return parent;
        }
        plantTree(outer, data);
        let list = outer.childNodes[0].childNodes;
        [...list].forEach(item => {
            fragment.appendChild(item);
        });
        this.targetDom.appendChild(fragment);
        let expandDivs = this.targetDom.querySelectorAll('[expanded]');
        [...expandDivs].forEach(item => {
            item.nextElementSibling.style.display = 'block';
        });
        this.options.onPlanted && this.options.onPlanted.call(this);
        'planted' in this.handlers ? this.emit('planted', '') : null;
    }
    add(newItem, target, isChild = true, isFront = true, callback) {
        if (this.destroyed) {
            return this;
        }
        let targetItem;
        if (!target && target !== 0) {
            targetItem = this.flatData.filter(k => k.floor === 1).slice(-1)[0];
            isChild = false;
            isFront = false;
        } else {
            targetItem = axFindItem(target, this.flatData);
        }
        let _this = this,
            itemDom = targetItem.headerDom,
            obj = {};
        if (!axIsEmpty(newItem) && typeof newItem == 'object') {
            let other = isChild ? {
                path: targetItem.path + '>' + newItem.id,
                floor: targetItem.floor + 1
            } : {
                path: targetItem.path.replace(new RegExp('(.*)' + targetItem.id), '$1' + newItem.id),
                floor: targetItem.floor
            };
            obj = Object.assign(newItem, other);
        } else {
            let newId = axIncreaseId(this.flatData),
                newName = newItem && typeof newItem === 'string' ? newItem : '新节点' + newId;
            obj = isChild ? {
                id: newId,
                label: newName,
                pId: targetItem.id,
                path: targetItem.path + '>' + newId,
                floor: targetItem.floor + 1
            } : {
                id: newId,
                label: newName,
                pId: targetItem.pId,
                path: targetItem.path.replace(new RegExp('(.*)' + targetItem.id), '$1' + newId),
                floor: targetItem.floor
            };
        }
        obj.headerDom = this.createItem(obj, obj.floor);
        obj.wrapperDom = axAddElem('li');
        this.addAttritue(obj, obj.headerDom);
        obj.wrapperDom.appendChild(obj.headerDom);
        if (isChild) {
            if (targetItem.children) {
                isFront ? targetItem.children.unshift(obj) : targetItem.children.push(obj);
                let ul = itemDom.nextElementSibling;
                ul.insertAdjacentElement(isFront ? "afterBegin" : "beforeEnd", obj.wrapperDom);
                this.flatData.push(obj);
                if (!targetItem.expanded) {
                    this.ulToggle(targetItem);
                }
            } else {
                targetItem.children = [];
                isFront ? targetItem.children.unshift(obj) : targetItem.children.push(obj);
                let arrow = itemDom.querySelector('[arrow]'),
                    ul = axAddElem('ul', { style: 'display:block' });
                arrow.classList.remove(this.options.arrowIcon[2]);
                arrow.classList.add(this.options.arrowIcon[0]);
                targetItem.expanded = true;
                itemDom.setAttribute('expanded', 'true');
                ul.insertAdjacentElement(isFront ? "afterBegin" : "beforeEnd", obj.wrapperDom);
                itemDom.insertAdjacentElement("afterEnd", ul);
                this.flatData.push(obj);
                this.siblingsCollapse(this.flatData, targetItem);
                arrow.onclick = function () {
                    _this.ulToggle(targetItem);
                }
            }
        } else {
            let parent = this.flatData.filter(i => i.id == targetItem.pId)[0],
                children = parent ? parent.children : this.treeData,
                index = children.indexOf(targetItem);
            if (isFront) {
                index == 0 ? children.unshift(obj) : children.splice(index, 0, obj);
            } else {
                children.splice(index + 1, 0, obj);
            }
            itemDom.parentElement.insertAdjacentElement(isFront ? "beforeBegin" : "afterEnd", obj.wrapperDom);
            this.flatData.push(obj);
            if (parent && !parent.expanded) {
                parent.expanded = true;
                this.ulToggle(parent);
            }
        }
        this.renderFinish(obj, this.flatData);
        obj.headerDom.setAttribute('tabindex', '-1');
        obj.headerDom.focus();
        obj.headerDom.onblur = function () {
            obj.headerDom.removeAttribute('tabindex');
        }
        this.options.onAdded && this.options.onAdded.call(this, obj, targetItem);
        'added' in this.handlers ? this.emit('added', obj, targetItem) : null;
        callback && callback.call(this, obj, targetItem);
        this.save();
        return this;
    }
    edit(itemObj, callback) {
        if (this.destroyed) {
            return this;
        }
        let _this = this,
            item = axFindItem(itemObj, this.flatData),
            itemDom = item.headerDom,
            nameDom = itemDom.querySelector('[label]'),
            editInput = axAddElem('input', { type: 'text' });
        if (itemDom.hasAttribute('editing')) {
            return false;
        }
        itemDom.setAttribute('editing', 'true');
        nameDom.innerHTML = '';
        nameDom.appendChild(editInput);
        editInput.focus();
        editInput.value = item.label;
        editInput.onblur = function () {
            itemDom.removeAttribute('editing');
            item.label = this.value;
            nameDom.innerHTML = this.value;
            _this.options.onEdited && _this.options.onEdited.call(_this, item);
            'edited' in _this.handlers ? _this.emit('edited', item) : null;
        }
        editInput.onkeyup = function (e) {
            if (e.keyCode == 13) {
                this.blur();
            }
        }
        this.options.onEditing && this.options.onEditing.call(this, item);
        'editing' in this.handlers ? this.emit('editing', item) : null;
        callback && callback.call(this, item);
        this.save();
        return this;
    }
    remove(itemObj, callback) {
        if (this.destroyed) {
            return this;
        }
        let _this = this,
            item = axFindItem(itemObj, this.flatData),
            itemLi = item.headerDom.parentElement;
        itemLi.remove();
        if (item.pId && item.pId != this.options.firstFloor) {
            let parent = this.flatData.filter(i => i.id == item.pId)[0],
                children = parent.children,
                index = children.indexOf(item);
            children.splice(index, 1);
        } else {
            this.treeData = this.treeData.filter(i => i != item);
        }
        this.flatData = this.flatData.filter(i => i != item && !i.path.includes('>' + item.id + '>'));
        this.options.onRemoved && this.options.onRemoved.call(this, item);
        'removed' in this.handlers ? this.emit('removed', item) : null;
        callback && callback.call(this, item);
        this.save();
        return this;
    }
    search(value, callback) {
        if (this.destroyed) {
            return this;
        }
        let _this = this;
        if (this.searchs.length > 0) {
            this.searchs.forEach(i => {
                i.headerDom.querySelector('[label]').innerHTML = i.label;
            });
            let other = this.treeData.filter(i => i.headerDom.parentElement.style.display == 'none');
            other.forEach(i => {
                i.headerDom.parentElement.removeAttribute('style');
            });
        }
        if (!value) {
            this.searchs = [];
            this.flatData.forEach(i => {
                let k = i.headerDom.parentElement;
                if (k.style.display == 'none') {
                    k.removeAttribute('style');
                }
            });
        } else {
            let ids = [];
            this.searchs = this.flatData.filter(i => i.label.includes(value));
            this.searchs.forEach(i => {
                ids.push(i.id);
                let text = i.labelDom.innerHTML.replace(value, '<i>' + value + '</i>');
                i.labelDom.innerHTML = text;
            });
            let parents = this.getParents(ids, 'both');
            parents.obj.forEach(i => {
                i.expanded = true;
                i.headerDom.setAttribute('expanded', 'true');
                i.headerDom.nextElementSibling.style.display = 'block';
            });
            let otherParents = [];
            parents.obj.forEach(i => {
                let brother = this.flatData.filter(k => k.pId = i.pId && k != i);
                otherParents.push(...brother);
            });
            parents.id = [...parents.id, ...ids];
            let firstParents = this.treeData.filter(i => !parents.id.includes(i.id));
            otherParents.push(...firstParents);
            let showItems = this.flatData.filter(i => !otherParents.includes(i));
            showItems.forEach(i => {
                i.headerDom.parentElement.removeAttribute('style');
            });
            for (let i = 0, len = otherParents.length; i < len; i++) {
                let k = otherParents[i];
                if (k.headerDom.parentElement.style.display == 'none') {
                    continue;
                } else {
                    k.headerDom.parentElement.style.display = 'none';
                }
            }
        }
        this.options.onSearched && this.options.onSearched.call(this, this.searchs, value);
        'searched' in this.handlers ? this.emit('searched', this.searchs, value) : null;
        callback && callback.call(this, this.searchs, value);
        this.save();
        return this;
    }
    check(idArr, flag = true, callback) {
        if (this.destroyed) {
            return this;
        }
        let _this = this,
            items;
        if (axType(idArr) == 'Array') {
            items = this.flatData.filter(i => idArr.includes(i.id));
            for (let i = 0, len = items.length; i < len; i++) {
                let item = items[i];
                if (item.checked == flag) {
                    continue;
                } else {
                    item.checked = flag;
                    if (this.options.checkType == 'checkbox') {
                        this.eachCheckbox(item, this.options.linkage);
                    } else if (this.options.checkType == 'radio') {
                        this.eachRadio(item, this.options.linkage);
                    }
                }
            }
        } else {
            items = this.flatData.filter(i => i.id == idArr);
            if (items.checked == flag) {
                return false;
            } else {
                items[0].checked = flag;
                if (this.options.checkType == 'checkbox') {
                    this.eachCheckbox(items[0], this.options.linkage);
                } else if (this.options.checkType == 'radio') {
                    this.eachRadio(items[0], this.options.linkage);
                }
            }
        }
        this.options.onSetChecked && this.options.onSetChecked.call(this, items);
        'setChecked' in this.handlers ? this.emit('setChecked', items) : null;
        callback && callback.call(this, items);
        this.save();
        return this;
    }
    disable(idArr, flag = true, callback) {
        if (this.destroyed) {
            return this;
        }
        let _this = this,
            items;
        if (axType(idArr) == 'Array') {
            items = this.flatData.filter(i => idArr.includes(i.id));
            let children = [];
            items.forEach(i => {
                children.push(...this.getChildren(i));
            });
            children = [...children].filter((i, index) => [...children].indexOf(i) == index);
            items.push(...children);
            for (let i = 0, len = items.length; i < len; i++) {
                let item = items[i];
                if (item.disabled == flag) {
                    continue;
                } else {
                    item.disabled = flag;
                    this.eachDisabled(item);
                    children.forEach(k => {
                        k.disabled = flag;
                        this.eachDisabled(k);
                    });
                }
            }
        } else {
            if (items.disabled == flag) {
                return false;
            } else {
                items = this.flatData.filter(i => i.id == idArr);
                this.getChildren(items[0]).forEach(i => {
                    i.disabled = flag;
                    this.eachDisabled(i);
                });
            }
        }
        items.forEach(i => {
            i.disabled = flag;
            this.clickCheck(i, this.flatData);
        });
        this.options.onSetDisabled && this.options.onSetDisabled.call(this, items);
        'setDisabled' in this.handlers ? this.emit('setDisabled', items) : null;
        callback && callback.call(this, items);
        this.save();
        return this;
    }
    readonly(idArr, flag = true, callback) {
        if (this.destroyed) {
            return this;
        }
        let _this = this,
            fun = (item, flag) => {
                if (flag) {
                    item.readonly = true;
                    item.headerDom.setAttribute('readonly', 'true');
                } else {
                    item.readonly = false;
                    item.headerDom.removeAttribute('readonly');
                }
            },
            items = [];
        if (axType(idArr) == 'Array') {
            items = this.flatData.filter(i => idArr.includes(i.id));
            items.forEach(i => {
                fun(i, flag);
            })
        } else if (axType(idArr) == 'Object') {
            fun(idArr, flag);
            items.push(idArr);
        } else {
            let item = this.flatData.filter(i => i.id == idArr)[0];
            fun(item, flag);
            items.push(item);
        }
        this.readonlys = [...this.readonlys, ...items];
        this.readonlys = [...this.readonlys].filter((i, index) => [...this.readonlys].indexOf(i) == index);
        this.options.onSetReadonly && this.options.onSetReadonly.call(this, items);
        'setReadonly' in this.handlers ? this.emit('setReadonly', items) : null;
        callback && callback.call(this, items);
        this.save();
        return this;
    }
    expand(idArr, callback) {
        if (this.destroyed) {
            return this;
        }
        let expands = []
        if (axType(idArr) == 'Array') {
            expands = this.flatData.filter(i => !i.expanded && i.children && idArr.includes(i.id));
        } else {
            expands = this.flatData.filter(i => !i.expanded && i.children && idArr === i.id);
        }
        expands.forEach(i => {
            i.expanded = false;
            this.ulToggle(i, false);
        });
        this.expandeds = this.flatData.filter(i => i.expanded && i.children).map(k => k.id);
        callback && callback.call(this, expands);
        return this;
    }
    expandAll(callback) {
        if (this.destroyed) {
            return this;
        }
        let expands = this.flatData.filter(i => !i.expanded && i.children);
        expands.forEach(i => {
            i.expanded = false;
            this.ulToggle(i, false);
        });
        this.expandeds = expands.map(k => k.id);
        this.options.onExpandAll && this.options.onExpandAll.call(this);
        'expandAll' in this.handlers ? this.emit('expandAll', '') : null;
        callback && callback.call(this);
        return this;
    }
    collapse(idArr, callback) {
        if (this.destroyed) {
            return this;
        }
        let collapses = []
        if (axType(idArr) == 'Array') {
            collapses = this.flatData.filter(i => i.expanded && i.children && idArr.includes(i.id));
        } else {
            collapses = this.flatData.filter(i => i.expanded && i.children && idArr === i.id);
        }
        collapses.forEach(i => {
            i.expanded = true;
            this.ulToggle(i, false);
        });
        this.expandeds = this.flatData.filter(i => i.expanded && i.children).map(k => k.id);
        callback && callback.call(this, collapses);
        return this;
    }
    collapseAll(callback) {
        if (this.destroyed) {
            return this;
        }
        let collapses = this.flatData.filter(i => i.expanded && i.children);
        collapses.forEach(i => {
            i.expanded = true;
            this.ulToggle(i, false);
        });
        this.expandeds = [];
        this.options.onCollapseAll && this.options.onCollapseAll.call(this);
        'collapseAll' in this.handlers ? this.emit('collapseAll', '') : null;
        callback && callback.call(this);
        return this;
    }
    reset(callback) {
        if (this.destroyed) {
            return this;
        }
        this.targetDom.innerHTML = this.rawHTML ? this.rawHTML : '';
        this.init();
        this.options.onReset && this.options.onReset.call(this);
        'reset' in this.handlers ? this.emit('reset', '') : null;
        callback && callback.call(this);
        return this;
    }
    updateContent(target, source, callback) {
        if (this.destroyed) {
            return this;
        }
        let targetItem = axFindItem(target, this.flatData);
        if (targetItem && typeof source === 'string') {
            targetItem.label = source;
            targetItem.labelDom.innerHTML = source;
            this.options.onUpdateContent && this.options.onUpdateContent.call(this, targetItem);
            'updateContent' in this.handlers ? this.emit('updateContent', targetItem) : null;
            callback && callback.call(this, targetItem);
            return this;
        }
    }
    update(setting, callback) {
        if (this.destroyed) {
            return this;
        }
        this.options = axExtend(this.options, setting);
        this.options.storageName ? axLocalStorage.set(this.options.storageName, {}) : null;
        this.targetDom.innerHTML = this.rawHTML ? this.rawHTML : '';
        this.init();
        'update' in this.handlers ? this.emit('update', '') : null;
        this.options.onUpdate && this.options.onUpdate.call(this);
        callback && callback.call(this);
        return this;
    }
    destroy(callback) {
        this.flatData.forEach(k => {
            k.labelDom.onclick = null;
            k.arrowDom.onclick = null;
            k.checkDom ? k.checkDom.onclick = null : null;
            k.addDom ? k.addDom.onclick = null : null;
            k.editDom ? k.editDom.onclick = null : null;
            k.removeDom ? k.removeDom.onclick = null : null;
            k.otherTools.forEach(i => {
                i.dom.onclick = null;
            });
        });
        this.contentXhr ? this.contentXhr.abort() : null;
        this.destroyed = true;
        this.options.storageName ? axLocalStorage.set(this.options.storageName, {}) : null;
        'destroy' in this.handlers ? this.emit('destroy', '') : null;
        this.options.onDestroy && this.options.onDestroy.call(this);
        callback && callback.call(this);
        return this;
    }
    save(props, callback) {
        if (this.destroyed) {
            return this;
        }
        if (!this.options.storageName) {
            return false;
        }
        setTimeout(() => {
            let idsExpanded = this.flatData.filter(k => k.expanded).map(k => k.id).filter(Boolean),
                idsDisabled = this.flatData.filter(k => k.disabled).map(k => k.id).filter(Boolean),
                idsSelected = this.flatData.filter(k => k.selected).map(k => k.id).filter(Boolean),
                idsChecked = this.flatData.filter(k => k.checked).map(k => k.id).filter(Boolean),
                idsReadonly = this.flatData.filter(k => k.readonly).map(k => k.id).filter(Boolean);
            if (!props) {
                axLocalStorage.set(this.options.storageName, { expanded: idsExpanded, selected: idsSelected, checked: idsChecked, disabled: idsDisabled, readonly: idsReadonly, content: this.flatData });
            } else {
                !props.hasOwnProperty('expanded') ? props.expanded = idsExpanded : null;
                !props.hasOwnProperty('disabled') ? props.disabled = idsDisabled : null;
                !props.hasOwnProperty('selected') ? props.selected = idsSelected : null;
                !props.hasOwnProperty('checked') ? props.checked = idsChecked : null;
                !props.hasOwnProperty('readonly') ? props.readonly = idsReadonly : null;
                !props.hasOwnProperty('content') ? props.content = this.flatData : null;
                axLocalStorage.set(this.options.storageName, props);
            }
            let getValue = axLocalStorage.get(this.options.storageName);
            'save' in this.handlers ? this.emit('save', getValue) : null;
            this.options.onSave && this.options.onSave.call(this, getValue);
            callback && callback.call(this, getValue);
            return this;
        }, 0)
    }
    on(type, handler) {
        axAddPlan(type, handler, this);
        return this;
    }
    emit(type, ...params) {
        axExePlan(type, this, ...params);
    }
    off(type, handler) {
        axDelPlan(type, handler, this);
        return this;
    }
}
(() => {
    document.querySelectorAll('[axTree]').forEach(element => {
        new axTree(element);
    });
})();