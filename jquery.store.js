(function ($) {
	$.Shop = function (element) {
		this.$element = $(element);
		this.init();
	};

	$.Shop.prototype = {
		init: function () {
			// Properties		
			this.cartPrefix = "Apparel-"; // Prefix string to be prepended to the cart's name in the session storage
			this.cartName = this.cartPrefix + "cart"; // 購物名稱存在 session storage
			this.shippingRates = this.cartPrefix + "shipping-rates"; // 運費 key 存在 session storage
			this.total = this.cartPrefix + "total"; // 總額 key in the session storage
			this.storage = sessionStorage; // session物件的捷徑


			this.$formAddToCart = this.$element.find("form.add-to-cart"); // 新增商品進購物車的表單
			this.$formCart = this.$element.find("#shopping-cart"); // cart表單#id
			this.$checkoutCart = this.$element.find("#checkout-cart"); // Checkout表單#id
			this.$checkoutOrderForm = this.$element.find("#checkout-order-form"); // order表單#id
			this.$shipping = this.$element.find("#sshipping"); // 運費input#id
			this.$subTotal = this.$element.find("#stotal"); // 總額input#id
			this.$shoppingCartActions = this.$element.find("#shopping-cart-actions"); // Cart 按鈕ul#id_存action
			this.$updateCartBtn = this.$shoppingCartActions.find("#update-cart"); // Cart 更新購物車按鈕li#id
			this.$emptyCartBtn = this.$shoppingCartActions.find("#empty-cart"); // Cart 清空購物車按鈕li#id
			this.$userDetails = this.$element.find("#user-details-content"); // Cart 按鈕ul#id_存使用者資訊

			this.currency = "$"; // 變數currency是記住字串貨幣符號

			// 表單驗證
			this.requiredFields = {
				expression: {
					value: /^([\w-\.]+)@((?:[\w]+\.)+)([a-z]){2,4}$/
				},

				str: {
					value: ""
				}
			};

			// 方法			
			this.createCart();
			this.handleAddToCartForm();
			this.handleCheckoutOrderForm();
			this.emptyCart();
			this.updateCart();
			this.displayCart();
			this.deleteProduct();
			this.displayUserDetails();
		},

		// Public methods	

		//在session建立購物車金鑰		
		createCart: function () {
			if (this.storage.getItem(this.cartName) == null) {

				var cart = {};
				cart.items = [];

				this.storage.setItem(this.cartName, this._toJSONString(cart));
				this.storage.setItem(this.shippingRates, "0");
				this.storage.setItem(this.total, "0");
			}
		},


		// order顯示使用者資訊		
		displayUserDetails: function () {
			if (this.$userDetails.length) {
				if (this.storage.getItem("shipping-name") == null) {
					var name = this.storage.getItem("billing-name");
					var email = this.storage.getItem("billing-email");
					var city = this.storage.getItem("billing-city");
					var address = this.storage.getItem("billing-address");
					var zip = this.storage.getItem("billing-zip");
					var country = this.storage.getItem("billing-country");

					var html = "<div class='detail'>";
					html += "<ul>";
					html += "<li>" + name + "</li>";
					html += "<li>" + email + "</li>";
					html += "<li>" + city + "</li>";
					html += "<li>" + address + "</li>";
					html += "<li>" + zip + "</li>";
					html += "</ul></div>";

					this.$userDetails[0].innerHTML = html;
				} else {
					var name = this.storage.getItem("billing-name");
					var email = this.storage.getItem("billing-email");
					var city = this.storage.getItem("billing-city");
					var address = this.storage.getItem("billing-address");
					var zip = this.storage.getItem("billing-zip");
					var country = this.storage.getItem("billing-country");

					var sName = this.storage.getItem("shipping-name");
					var sEmail = this.storage.getItem("shipping-email");
					var sCity = this.storage.getItem("shipping-city");
					var sAddress = this.storage.getItem("shipping-address");
					var sZip = this.storage.getItem("shipping-zip");

					var html = "<div class='detail'>";
					html += "<h2>Billing</h2>";
					html += "<ul>";
					html += "<li>" + name + "</li>";
					html += "<li>" + email + "</li>";
					html += "<li>" + city + "</li>";
					html += "<li>" + address + "</li>";
					html += "</ul></div>";
					html += "<div class='detail right'>";
					html += "<h2>Shipping</h2>";
					html += "<ul>";
					html += "<li>" + sName + "</li>";
					html += "<li>" + sEmail + "</li>";
					html += "<li>" + sCity + "</li>";
					html += "<li>" + sAddress + "</li>";
					html += "</ul></div>";

					this.$userDetails[0].innerHTML = html;
				}
			}
		},

		// 刪除購物車裡的產品
		deleteProduct: function () {
			var self = this;
			if (self.$formCart.length) {
				var cart = this._toJSONObject(this.storage.getItem(this.cartName));
				var items = cart.items;

				$(document).on("click", ".pdelete a", function (e) {
					e.preventDefault();
					var productName = $(this).data("product");
					var newItems = [];
					for (var i = 0; i < items.length; ++i) {
						var item = items[i];
						var product = item.product;
						if (product == productName) {
							items.splice(i, 1);
						}
					}
					newItems = items;
					var updatedCart = {};
					updatedCart.items = newItems;

					var updatedTotal = 0;
					var totalQty = 0;
					if (newItems.length == 0) {
						updatedTotal = 0;
						totalQty = 0;
					} else {
						for (var j = 0; j < newItems.length; ++j) {
							var prod = newItems[j];
							var sub = prod.price * prod.qty;
							updatedTotal += sub;
							totalQty += prod.qty;
						}
					}

					self.storage.setItem(self.total, self._convertNumber(updatedTotal));
					self.storage.setItem(self.shippingRates, self._convertNumber(self._calculateShipping(totalQty)));

					self.storage.setItem(self.cartName, self._toJSONString(updatedCart));
					$(this).parents("tr").remove();
					self.$subTotal[0].innerHTML = self.currency + " " + self.storage.getItem(self.total);
				});
			}
		},

		// 顯示購物車		
		displayCart: function () {
			if (this.$formCart.length) {
				var cart = this._toJSONObject(this.storage.getItem(this.cartName));
				var items = cart.items;
				var $tableCart = this.$formCart.find(".shopping-cart");
				var $tableCartBody = $tableCart.find("tbody");

				if (items.length == 0) {
					$tableCartBody.html("");
				} else {
					for (var i = 0; i < items.length; ++i) {
						var item = items[i];
						var product = item.product;
						var price = this.currency + " " + item.price;
						var qty = item.qty;
						var pqty = item.price * item.qty;
						var html = "<tr><td class='pname'>" + product + "</td>" + "<td class='pqty'><input type='text' value='" + qty + "' class='qty'/></td>";
						html += "<td class='pprice'>" + pqty + "</td><td class='pdelete'><a href='' data-product='" + product + "'>&times;</a></td></tr>";

						$tableCartBody.html($tableCartBody.html() + html);
					}
				}

				if (items.length == 0) {
					this.$subTotal[0].innerHTML = this.currency + " " + 0.00;
				} else {
					var total = this.storage.getItem(this.total);
					this.$subTotal[0].innerHTML = this.currency + " " + total;
				}
			} else if (this.$checkoutCart.length) {
				var checkoutCart = this._toJSONObject(this.storage.getItem(this.cartName));
				var cartItems = checkoutCart.items;
				var $cartBody = this.$checkoutCart.find("tbody");

				if (cartItems.length > 0) {
					for (var j = 0; j < cartItems.length; ++j) {
						var cartItem = cartItems[j];
						var cartProduct = cartItem.product;
						var cartPrice = this.currency + " " + cartItem.price;
						var cartPricet = this.currency + " " + (cartItem.price*cartItem.qty);
						var cartQty = cartItem.qty;
						var cartHTML = "<tr><td class='pname'>" + cartProduct + "</td>" + "<td class='pqty'>" + cartQty + "</td>" + "<td class='pprice'>" + cartPricet + "</td></tr>";

						$cartBody.html($cartBody.html() + cartHTML);
					}
				} else {
					$cartBody.html("");
				}

				if (cartItems.length > 0) {

					var cartTotal = this.storage.getItem(this.total);
					var cartShipping = this.storage.getItem(this.shippingRates);
					var subTot = this._convertString(cartTotal) + this._convertString(cartShipping);

					this.$subTotal[0].innerHTML = this.currency + " " + this._convertNumber(subTot);
					this.$shipping[0].innerHTML = this.currency + " " + cartShipping;
				} else {
					this.$subTotal[0].innerHTML = this.currency + " " + 0.00;
					this.$shipping[0].innerHTML = this.currency + " " + 0.00;
				}
			}
		},

		// Empties the cart by calling the _emptyCart() method
		// @see $.Shop._emptyCart()

		emptyCart: function () {
			var self = this;
			if (self.$emptyCartBtn.length) {
				self.$emptyCartBtn.on("click", function () {
					self._emptyCart();
				});
			}
		},

		// 更新購物車		
		updateCart: function () {
			var self = this;
			if (self.$updateCartBtn.length) {
				self.$updateCartBtn.on("click", function () {
					var $rows = self.$formCart.find("tbody tr");
					var cart = self.storage.getItem(self.cartName);
					var shippingRates = self.storage.getItem(self.shippingRates);
					var total = self.storage.getItem(self.total);

					var updatedTotal = 0;
					var totalQty = 0;
					var updatedCart = {};
					updatedCart.items = [];

					$rows.each(function () {
						var $row = $(this);
						var pname = $.trim($row.find(".pname").text());
						var pqty = self._convertString($row.find(".pqty > .qty").val());
						var pprice = self._convertString(self._extractPrice($row.find(".pprice")));

						var cartObj = {
							product: pname,
							price: pprice,
							qty: pqty
						};

						updatedCart.items.push(cartObj);

						var subTotal = pqty * pprice;
						updatedTotal += subTotal;
						totalQty += pqty;
					});

					self.storage.setItem(self.total, self._convertNumber(updatedTotal));
					self.storage.setItem(self.shippingRates, self._convertNumber(self._calculateShipping(totalQty)));
					self.storage.setItem(self.cartName, self._toJSONString(updatedCart));

				});
			}
		},

		// 商品加入購物車		
		handleAddToCartForm: function () {
			var self = this;
			self.$formAddToCart.each(function () {
				var $form = $(this);
				var $product = $form.parent();
				var price = self._convertString($product.data("price"));
				var name = $product.data("name");

				$form.on("submit", function () {
					var qty = self._convertString($form.find(".qty").val());
					var subTotal = qty * price;
					var total = self._convertString(self.storage.getItem(self.total));
					var sTotal = total + subTotal;
					self.storage.setItem(self.total, sTotal);
					self._addToCart({
						product: name,
						price: price,
						qty: qty
					});
					var shipping = self._convertString(self.storage.getItem(self.shippingRates));
					var shippingRates = self._calculateShipping(qty);
					var totalShipping = shipping + shippingRates;

					self.storage.setItem(self.shippingRates, totalShipping);
				});
			});
		},


		//透過新增validation routine和儲存使用者資訊到session中來處理結帳表單		
		handleCheckoutOrderForm: function () {
			var self = this;
			if (self.$checkoutOrderForm.length) {
				var $sameAsBilling = $("#same-as-billing");
				$sameAsBilling.on("change", function () {
					var $check = $(this);
					if ($check.prop("checked")) {
						$("#fieldset-shipping").slideUp("normal");
					} else {
						$("#fieldset-shipping").slideDown("normal");
					}
				});

				self.$checkoutOrderForm.on("submit", function () {
					var $form = $(this);
					var valid = self._validateForm($form);

					if (!valid) {
						return valid;
					} else {
						self._saveFormData($form);
					}
				});
			}
		},

		// Private methods		
		// 清空session		
		_emptyCart: function () {
			this.storage.clear();
		},

		/* Format a number by decimal places
		 * @param num Number the number to be formatted
		 * @param places Number the decimal places
		 * @returns n Number the formatted number
		 */



		_formatNumber: function (num, places) {
			var n = num.toFixed(places);
			return n;
		},

		/* Extract the numeric portion from a string
		 * @param element Object the jQuery element that contains the relevant string
		 * @returns price String the numeric string
		 */


		_extractPrice: function (element) {
			var self = this;
			var text = element.text();
			var price = text.replace(self.currency, "").replace(" ", "");
			return price;
		},

		/* Converts a numeric string into a number
		 * @param numStr String the numeric string to be converted
		 * @returns num Number the number
		 */

		_convertString: function (numStr) {
			var num;
			if (/^[-+]?[0-9]+\.[0-9]+$/.test(numStr)) {
				num = parseFloat(numStr);
			} else if (/^\d+$/.test(numStr)) {
				num = parseInt(numStr, 10);
			} else {
				num = Number(numStr);
			}

			if (!isNaN(num)) {
				return num;
			} else {
				console.warn(numStr + " cannot be converted into a number");
				return false;
			}
		},

		/* Converts a number to a string
		 * @param n Number the number to be converted
		 * @returns str String the string returned
		 */

		_convertNumber: function (n) {
			var str = n.toString();
			return str;
		},

		/* Converts a JSON string to a JavaScript object
		 * @param str String the JSON string
		 * @returns obj Object the JavaScript object
		 */

		_toJSONObject: function (str) {
			var obj = JSON.parse(str);
			return obj;
		},

		/* Converts a JavaScript object to a JSON string
		 * @param obj Object the JavaScript object
		 * @returns str String the JSON string
		 */


		_toJSONString: function (obj) {
			var str = JSON.stringify(obj);
			return str;
		},


		/* Add an object to the cart as a JSON string
		 * @param values Object the object to be added to the cart
		 * @returns void
		 */


		_addToCart: function (values) {
			var cart = this.storage.getItem(this.cartName);

			var cartObject = this._toJSONObject(cart);
			var cartCopy = cartObject;
			var items = cartCopy.items;
			items.push(values);

			this.storage.setItem(this.cartName, this._toJSONString(cartCopy));
		},

		/* Custom shipping rates calculation based on the total quantity of items in the cart
		 * @param qty Number the total quantity of items
		 * @returns shipping Number the shipping rates
		 */

		_calculateShipping: function (qty) {
			var shipping = 0;
			if (qty >= 6) {
				shipping = 10;
			}
			if (qty >= 12 && qty <= 30) {
				shipping = 20;
			}

			if (qty >= 30 && qty <= 60) {
				shipping = 30;
			}

			if (qty > 60) {
				shipping = 0;
			}

			return shipping;

		},

		/* Validates the checkout form
		 * @param form Object the jQuery element of the checkout form
		 * @returns valid Boolean true for success, false for failure
		 */

		_validateForm: function (form) {
			var self = this;
			var fields = self.requiredFields;
			var $visibleSet = form.find("fieldset:visible");
			var valid = true;

			form.find(".message").remove();

			$visibleSet.each(function () {

				$(this).find(":input").each(function () {
					var $input = $(this);
					var type = $input.data("type");
					var msg = $input.data("message");

					if (type == "string") {
						if ($input.val() == fields.str.value) {
							$("<span class='message'/>").text(msg).
								insertBefore($input);
							valid = false;
						}
					} else {
						if (!fields.expression.value.test($input.val())) {
							$("<span class='message'/>").text(msg).
								insertBefore($input);

							valid = false;
						}
					}
				});
			});

			return valid;

		},

		/* Save the data entered by the user in the ckeckout form
		 * @param form Object the jQuery element of the checkout form
		 * @returns void
		 */

		_saveFormData: function (form) {
			var self = this;
			var $visibleSet = form.find("fieldset:visible");

			$visibleSet.each(function () {
				var $set = $(this);
				if ($set.is("#fieldset-billing")) {
					var name = $("#name", $set).val();
					var email = $("#email", $set).val();
					var city = $("#city", $set).val();
					var address = $("#address", $set).val();
					var zip = $("#zip", $set).val();
					var country = $("#country", $set).val();

					self.storage.setItem("billing-name", name);
					self.storage.setItem("billing-email", email);
					self.storage.setItem("billing-city", city);
					self.storage.setItem("billing-address", address);
					self.storage.setItem("billing-zip", zip);
					self.storage.setItem("billing-country", country);
				} else {
					var sName = $("#sname", $set).val();
					var sEmail = $("#semail", $set).val();
					var sCity = $("#scity", $set).val();
					var sAddress = $("#saddress", $set).val();
					var sZip = $("#szip", $set).val();
					//var sCountry = $("#scountry", $set).val();

					self.storage.setItem("shipping-name", sName);
					self.storage.setItem("shipping-email", sEmail);
					self.storage.setItem("shipping-city", sCity);
					self.storage.setItem("shipping-address", sAddress);
					self.storage.setItem("shipping-zip", sZip);
					//self.storage.setItem("shipping-country", sCountry);
				}
			});
		}
	};

	$(function () {
		var shop = new $.Shop("#site");
	});

})(jQuery);
