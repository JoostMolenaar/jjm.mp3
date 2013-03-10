mp3.views.UserList = mp3.base.ListView.extend({
    el: "#users",
    template: "#users-template",
    itemViewType: mp3.base.ListItem.extend({ 
        template: "#user-item-template" 
    }),
    nextViewType: mp3.views.CollectionList
});
