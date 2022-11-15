window['ThemeSection_header'] = (count) => {
  const dropdownCount = parseInt(count);
  const menuOpen = {};
  for (let i = 0; i < dropdownCount; i++) {
    menuOpen['menu' + i] = false;
  }

  return {
    menuOpen: menuOpen,
    searchOpen: false,
    headerIsSticky: false,
    scrollY: 0,
    navWrapped: false,
    headerHeight: 0,
    get isStuck() {
      return this.headerIsSticky && this.scrollY > this.headerHeight * 2;
    },
    get menuIsActive() {
      return !Object.keys(menuOpen).every((k) => !menuOpen[k]);
    },
    mounted() {
      initTeleport(this.$root);
      Alpine.store('modals').register('nav', 'leftDrawer');

      document.addEventListener('keyup', (event) => {
        if (event.key === 'Escape') {
          for (let i = 0; i < dropdownCount; i++) {
            if (this.menuOpen['menu' + i] === true) {
              this.menuOpen['menu' + i] = false;
              document.querySelector(`[aria-controls="menu${i}"]`).focus();
            }
          }
        }
      });

      document.body.addEventListener('label:search:closebutton', () => {
        this.searchOpen = false;
      });

      if (this.$root.hasAttribute('data-sticky-header')) {
        this.setUpSticky();
      }

      //set header height

      this.headerResizeFunctions();
      this._debouncedHeaderFunctions = debounce(
        this.headerResizeFunctions.bind(this),
        300
      );

      window.addEventListener('resize', this._debouncedHeaderFunctions);
      document.addEventListener('shopify:section:load', (e) => {
        if (!e.target.querySelector('.site-header')) return;
        this.headerResizeFunctions();
      });
    },
    headerResizeFunctions() {
      this.calculateHeaderHeight();
      this.calculateNavWrap();
    },
    calculateNavWrap() {
      const wrappedItems = [];
      let prevItem = {};
      let currItem = {};
      if (this.$refs.navigation !== undefined) {
        const items = this.$refs.navigation.children;
        for (var i = 0; i < items.length; i++) {
          currItem = items[i].getBoundingClientRect();
          if (prevItem && prevItem.top < currItem.top) {
            wrappedItems.push(items[i]);
          }
          prevItem = currItem;
        }
        if (wrappedItems.length > 0) {
          this.navWrapped = true;
        } else {
          this.navWrapped = false;
        }
      }
    },
    calculateHeaderHeight() {
      this.headerHeight =
        document.getElementById('headerBorderWrap').clientHeight;
      document.documentElement.style.setProperty(
        '--header-height',
        `${this.headerHeight}px`
      );
    },
    setUpSticky() {
      const headerContainerEl = document.getElementById(
        'shopify-section-header'
      );

      const sentinelEl = document.createElement('div');
      sentinelEl.setAttribute('id', 'HeaderSentinel');

      headerContainerEl.parentNode.insertBefore(sentinelEl, headerContainerEl);

      if (!this.$root.hasAttribute('data-overlay-header')) {
        const backdropEl = document.createElement('div');
        backdropEl.setAttribute('id', 'HeaderBackdrop');

        headerContainerEl.parentNode.insertBefore(
          backdropEl,
          headerContainerEl
        );
      }

      const observer = new IntersectionObserver(
        (e) => {
          e.forEach((entry) => {
            this.headerIsSticky = entry.intersectionRatio < 1 ? true : false;
          });
        },
        {
          rootMargin: '-1px 0px 0px 0px',
          threshold: [1],
        }
      );

      observer.observe(sentinelEl);

      let timer = null;
      const checkScrollPosition = (e) => {
        this.scrollY = window.scrollY;
        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          this.scrollY = window.scrollY;
        }, 150);
      };

      const _throttledScrollHandler = throttle(checkScrollPosition, 150);
      document.addEventListener('scroll', _throttledScrollHandler);

      this.scrollY = window.scrollY;
    },
    openMenu(index) {
      this.menuOpen['menu' + index] = true;
    },
    focusOut(event, menu) {
      if (event.relatedTarget) {
        const dropdownParent = event.relatedTarget.closest(
          '[data-header-dropdown]'
        );
        if (!dropdownParent) {
          this.menuOpen[menu] = false;
        }
      }
    },
    closeSearch() {
      this.searchOpen = false;
      this.$refs.search.focus();
    },
    openSearch() {
      this.searchOpen = true;
      let input = document.querySelector('.header-search-input');
      setTimeout(() => {
        input.focus();
      }, 100);
    },
  };
};
